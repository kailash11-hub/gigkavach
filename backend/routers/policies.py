from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db, Worker, Policy
from models.schemas import PolicyCreateRequest
from ml.risk_model import predict_risk_score
import uuid, datetime

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.post("/create")
def create_policy(req: PolicyCreateRequest, db: Session = Depends(get_db)):
    w = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not w: raise HTTPException(404, "Worker not found")
    risk = predict_risk_score(
        persona=req.persona, city_tier=w.city_tier,
        avg_weekly_income=w.avg_weekly_income, experience_years=w.experience_years,
        active_hours=w.active_hours_per_day, weather_severity=0.3,
        social_disruption=0.1, aqi=100, rain_mm=10, temp_celsius=32,
        day_of_week=1, time_bucket=1, historical_claim_rate=w.historical_claim_rate,
    )
    start = datetime.datetime.utcnow()
    p = Policy(
        id=str(uuid.uuid4()), worker_id=req.worker_id, worker_name=w.name,
        persona=req.persona, platform=w.platform, status="ACTIVE",
        weeks=req.weeks, weekly_premium_inr=risk["weekly_premium_inr"],
        total_premium_inr=round(risk["weekly_premium_inr"]*req.weeks,2),
        max_payout_inr=risk["max_payout_inr"], risk_score=risk["risk_score"],
        risk_level=risk["risk_level"], start_date=start,
        end_date=start+datetime.timedelta(weeks=req.weeks),
        created_at=start,
    )
    db.add(p); db.commit(); db.refresh(p)
    return {"success": True, "policy": _p(p)}

@router.get("/")
def list_policies(skip: int=0, limit: int=50, status: str=None, db: Session=Depends(get_db)):
    q = db.query(Policy)
    if status: q = q.filter(Policy.status == status.upper())
    total = q.count()
    return {"total": total, "policies": [_p(p) for p in q.offset(skip).limit(limit).all()]}

@router.get("/worker/{worker_id}")
def worker_policies(worker_id: str, db: Session = Depends(get_db)):
    return [_p(p) for p in db.query(Policy).filter(Policy.worker_id == worker_id).all()]

@router.get("/{policy_id}")
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    p = db.query(Policy).filter(Policy.id == policy_id).first()
    if not p: raise HTTPException(404, "Policy not found")
    return _p(p)

def _p(p):
    return {"id":p.id,"worker_id":p.worker_id,"worker_name":p.worker_name,
            "persona":p.persona,"platform":p.platform,"status":p.status,
            "weeks":p.weeks,"weekly_premium_inr":p.weekly_premium_inr,
            "total_premium_inr":p.total_premium_inr,"max_payout_inr":p.max_payout_inr,
            "risk_score":p.risk_score,"risk_level":p.risk_level,
            "start_date":str(p.start_date),"end_date":str(p.end_date),"created_at":str(p.created_at)}
