from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Worker, Policy, Claim, Payout
from collections import defaultdict

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    workers = db.query(Worker).all()
    policies = db.query(Policy).all()
    claims = db.query(Claim).all()
    payouts = db.query(Payout).all()
    total_workers = len(workers)
    active_policies = sum(1 for p in policies if p.status=="ACTIVE")
    total_claims = len(claims)
    approved = sum(1 for c in claims if c.status=="APPROVED")
    flagged = sum(1 for c in claims if c.status=="FLAGGED")
    rejected = sum(1 for c in claims if c.status=="REJECTED")
    total_payout = sum(c.payout_inr for c in claims)
    total_premium = sum(p.total_premium_inr for p in policies)
    fraud_rate = round(flagged/total_claims*100,2) if total_claims else 0
    persona_stats = defaultdict(lambda:{"workers":0,"policies":0,"claims":0,"payout":0})
    for w in workers: persona_stats[w.persona]["workers"]+=1
    for p in policies: persona_stats[p.persona]["policies"]+=1
    for c in claims:
        persona_stats[c.persona]["claims"]+=1
        persona_stats[c.persona]["payout"]+=c.payout_inr
    risk_dist = {"LOW":0,"MEDIUM":0,"HIGH":0}
    for w in workers: risk_dist[w.risk_level or "LOW"] = risk_dist.get(w.risk_level or "LOW",0)+1
    recent = sorted(claims, key=lambda x: str(x.created_at), reverse=True)[:10]
    return {
        "summary":{"total_workers":total_workers,"active_policies":active_policies,
                   "total_claims":total_claims,"approved_claims":approved,"flagged_claims":flagged,
                   "rejected_claims":rejected,"total_payout_inr":round(total_payout,2),
                   "total_premium_collected_inr":round(total_premium,2),"fraud_rate_percent":fraud_rate,
                   "claim_approval_rate":round(approved/total_claims*100,2) if total_claims else 0},
        "persona_breakdown":dict(persona_stats),
        "risk_distribution":risk_dist,
        "recent_claims":[{"id":c.id,"persona":c.persona,"disruption":c.disruption_subtype,
                          "hours_lost":c.hours_lost,"fraud_score":c.fraud_score,
                          "ml_confidence":c.ml_confidence,"payout_inr":c.payout_inr,
                          "status":c.status,"created_at":str(c.created_at)} for c in recent],
    }

@router.get("/payouts")
def payout_summary(db: Session = Depends(get_db)):
    payouts = db.query(Payout).order_by(Payout.processed_at.desc()).all()
    total = sum(p.amount_inr for p in payouts)
    return {"total_payouts":len(payouts),"total_amount_inr":round(total,2),
            "payouts":[{"claim_id":p.claim_id,"worker_id":p.worker_id,"amount_inr":p.amount_inr,
                        "method":p.method,"status":p.status,"processed_at":str(p.processed_at)} for p in payouts[:30]]}
