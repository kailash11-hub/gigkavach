from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db, Worker, Policy, Claim, Payout
from models.schemas import ClaimRequest
from ml.risk_model import detect_fraud, classify_claim
import uuid, datetime

router = APIRouter(prefix="/claims", tags=["Claims"])

# ─────────────────────────────────────────────
# Duplicate claim prevention
# ─────────────────────────────────────────────
def _check_duplicate(db: Session, worker_id: str, disruption_subtype: str) -> bool:
    """Prevent duplicate claims for the same disruption within 24 hours."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    existing = db.query(Claim).filter(
        Claim.worker_id == worker_id,
        Claim.disruption_subtype == disruption_subtype,
        Claim.created_at >= cutoff,
        Claim.status != "REJECTED"
    ).first()
    return existing is not None

# ─────────────────────────────────────────────
# Location and activity validation
# ─────────────────────────────────────────────
def _validate_location_activity(
    worker: Worker,
    weather_severity: float,
    social_disruption: float,
    location_match_score: float,
    hours_lost: int,
) -> dict:
    """
    Validate that claim is consistent with worker's location and activity.
    Returns validation result with flags.
    """
    flags = []
    score = 1.0

    # Location match check
    if location_match_score < 0.5:
        flags.append("Location mismatch — worker not in affected zone")
        score -= 0.3

    # Activity hours check — can't lose more hours than worked
    if hours_lost > worker.active_hours_per_day:
        flags.append(f"Hours lost ({hours_lost}h) exceeds daily active hours ({worker.active_hours_per_day}h)")
        score -= 0.25

    # Disruption severity check — low severity but high claimed loss
    if weather_severity < 0.2 and social_disruption < 0.2:
        flags.append("Low disruption severity but claim filed")
        score -= 0.2

    # Experience check — new workers more likely to misunderstand coverage
    if worker.experience_years < 0.5:
        flags.append("New worker — first claim reviewed manually")
        score -= 0.05

    return {
        "valid": score >= 0.5,
        "validation_score": round(max(score, 0), 3),
        "flags": flags,
        "requires_manual_review": score < 0.6 and score >= 0.5,
    }

# ─────────────────────────────────────────────
# File claim
# ─────────────────────────────────────────────
@router.post("/file")
def file_claim(req: ClaimRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == req.policy_id).first()
    if not policy:
        raise HTTPException(404, "Policy not found")
    if policy.status != "ACTIVE":
        raise HTTPException(400, "Policy is not active")

    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()

    # ── Duplicate claim prevention ──
    if _check_duplicate(db, req.worker_id, req.disruption_subtype):
        raise HTTPException(400,
            f"Duplicate claim: A claim for '{req.disruption_subtype}' was already filed within the last 24 hours.")

    # ── Location & activity validation ──
    validation = _validate_location_activity(
        worker=worker,
        weather_severity=req.weather_severity,
        social_disruption=req.social_disruption,
        location_match_score=req.location_match_score,
        hours_lost=req.hours_reported_lost,
    ) if worker else {"valid": True, "validation_score": 0.8, "flags": [], "requires_manual_review": False}

    if not validation["valid"]:
        raise HTTPException(400,
            f"Claim validation failed: {'; '.join(validation['flags'])}")

    # ── Fraud detection (Isolation Forest) ──
    fraud_result = detect_fraud(
        claimed_loss_ratio=req.claimed_loss_ratio,
        weather_severity=req.weather_severity,
        social_disruption=req.social_disruption,
        hours_reported_lost=req.hours_reported_lost,
        historical_fraud_score=worker.historical_claim_rate if worker else 0,
        location_match_score=req.location_match_score,
    )

    # ── Claim classification (Random Forest) ──
    claim_result = classify_claim(
        weather_severity=req.weather_severity,
        social_disruption=req.social_disruption,
        claimed_loss_ratio=req.claimed_loss_ratio,
        hours_lost=req.hours_reported_lost,
        location_match_score=req.location_match_score,
        fraud_score=fraud_result["fraud_confidence"],
        policy_age_weeks=4,
    )

    # ── Final decision ──
    if fraud_result["is_fraud"]:
        status = "FLAGGED"
        payout = 0
    elif validation["requires_manual_review"]:
        status = "PENDING_REVIEW"
        payout = 0
    elif claim_result["approved"]:
        status = "APPROVED"
        payout = round(policy.max_payout_inr * req.claimed_loss_ratio * 0.8, 2)
    else:
        status = "REJECTED"
        payout = 0

    cid = str(uuid.uuid4())
    c = Claim(
        id=cid, policy_id=req.policy_id, worker_id=req.worker_id,
        persona=req.persona, disruption_type=req.disruption_type,
        disruption_subtype=req.disruption_subtype, description=req.description,
        weather_severity=req.weather_severity, social_disruption=req.social_disruption,
        claimed_loss_ratio=req.claimed_loss_ratio, hours_lost=req.hours_reported_lost,
        location_match_score=req.location_match_score,
        fraud_flag=fraud_result["is_fraud"],
        fraud_score=fraud_result["fraud_confidence"],
        anomaly_score=fraud_result["anomaly_score"],
        approval_probability=claim_result["approval_probability"],
        ml_confidence=claim_result["confidence"],
        status=status, payout_inr=payout,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(c)

    # ── Instant payout if approved ──
    if status == "APPROVED":
        db.add(Payout(
            id=str(uuid.uuid4()), claim_id=cid, worker_id=req.worker_id,
            amount_inr=payout, method="UPI", status="PROCESSED",
            processed_at=datetime.datetime.utcnow()
        ))

    db.commit(); db.refresh(c)
    return {
        "success": True,
        "claim": _c(c),
        "fraud_analysis": fraud_result,
        "ml_decision": claim_result,
        "validation": validation,
    }


# ─────────────────────────────────────────────
# Real-time trigger monitoring
# ─────────────────────────────────────────────
@router.post("/auto-trigger")
def auto_trigger_claims(db: Session = Depends(get_db)):
    """
    Parametric automation: scan active policies and auto-file claims
    when weather/disruption conditions exceed thresholds.
    In production this runs as a scheduled job every hour.
    """
    from routers.weather import MOCK_WEATHER, compute_risk_from_weather

    triggered = []
    active_policies = db.query(Policy).filter(Policy.status == "ACTIVE").all()

    for pol in active_policies:
        worker = db.query(Worker).filter(Worker.id == pol.worker_id).first()
        if not worker:
            continue

        # Get current conditions for worker's city
        mock = MOCK_WEATHER.get(worker.city,
            {"temp": 32, "rain": 5, "aqi": 100, "desc": "Clear"})
        risk = compute_risk_from_weather(mock["temp"], mock["rain"], mock["aqi"])
        weather_severity = risk["weather_severity"]

        # Auto-trigger threshold: weather severity > 0.7
        if weather_severity < 0.7:
            continue

        # Check no duplicate in last 24h
        if _check_duplicate(db, worker.id, mock["desc"]):
            continue

        # Auto-file claim
        fraud_result = detect_fraud(
            claimed_loss_ratio=0.5, weather_severity=weather_severity,
            social_disruption=0.2, hours_reported_lost=4,
            historical_fraud_score=worker.historical_claim_rate,
            location_match_score=0.95,
        )
        claim_result = classify_claim(
            weather_severity=weather_severity, social_disruption=0.2,
            claimed_loss_ratio=0.5, hours_lost=4,
            location_match_score=0.95,
            fraud_score=fraud_result["fraud_confidence"],
            policy_age_weeks=4,
        )

        payout = round(pol.max_payout_inr * 0.5 * 0.8, 2) if claim_result["approved"] else 0
        status = "APPROVED" if claim_result["approved"] and not fraud_result["is_fraud"] else "FLAGGED"

        cid = str(uuid.uuid4())
        db.add(Claim(
            id=cid, policy_id=pol.id, worker_id=worker.id,
            persona=pol.persona, disruption_type="environmental",
            disruption_subtype=mock["desc"], description="Auto-triggered by parametric monitor",
            weather_severity=weather_severity, social_disruption=0.2,
            claimed_loss_ratio=0.5, hours_lost=4, location_match_score=0.95,
            fraud_flag=fraud_result["is_fraud"],
            fraud_score=fraud_result["fraud_confidence"],
            anomaly_score=fraud_result["anomaly_score"],
            approval_probability=claim_result["approval_probability"],
            ml_confidence=claim_result["confidence"],
            status=status, payout_inr=payout,
            created_at=datetime.datetime.utcnow(),
        ))
        if status == "APPROVED":
            db.add(Payout(
                id=str(uuid.uuid4()), claim_id=cid, worker_id=worker.id,
                amount_inr=payout, method="UPI", status="PROCESSED",
                processed_at=datetime.datetime.utcnow()
            ))

        triggered.append({
            "worker": worker.name, "city": worker.city,
            "disruption": mock["desc"], "weather_severity": weather_severity,
            "status": status, "payout": payout,
        })

    db.commit()
    return {
        "triggered_claims": len(triggered),
        "details": triggered,
        "message": f"Auto-trigger scan complete. {len(triggered)} claims initiated.",
    }


@router.get("/")
def list_claims(skip:int=0, limit:int=50, status:str=None, db:Session=Depends(get_db)):
    q = db.query(Claim)
    if status: q = q.filter(Claim.status == status.upper())
    return {"total": q.count(), "claims": [_c(c) for c in q.order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()]}

@router.get("/worker/{worker_id}")
def worker_claims(worker_id:str, db:Session=Depends(get_db)):
    return [_c(c) for c in db.query(Claim).filter(Claim.worker_id==worker_id).order_by(Claim.created_at.desc()).all()]

@router.get("/{claim_id}")
def get_claim(claim_id:str, db:Session=Depends(get_db)):
    c = db.query(Claim).filter(Claim.id==claim_id).first()
    if not c: raise HTTPException(404,"Claim not found")
    return _c(c)

def _c(c):
    return {
        "id":c.id, "policy_id":c.policy_id, "worker_id":c.worker_id,
        "persona":c.persona, "disruption_type":c.disruption_type,
        "disruption_subtype":c.disruption_subtype, "disruption":c.disruption_subtype,
        "description":c.description, "weather_severity":c.weather_severity,
        "social_disruption":c.social_disruption, "claimed_loss_ratio":c.claimed_loss_ratio,
        "hours_lost":c.hours_lost, "location_match_score":c.location_match_score,
        "fraud_flag":c.fraud_flag, "fraud_score":c.fraud_score,
        "anomaly_score":c.anomaly_score, "approval_probability":c.approval_probability,
        "ml_confidence":c.ml_confidence, "status":c.status, "payout_inr":c.payout_inr,
        "created_at":str(c.created_at),
    }
