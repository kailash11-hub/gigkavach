from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db, Worker
from models.schemas import WorkerOnboardRequest
from ml.risk_model import predict_risk_score
from auth import get_current_user, require_admin
import uuid, datetime

router = APIRouter(prefix="/workers", tags=["Workers"])

@router.post("/onboard")
def onboard_worker(req: WorkerOnboardRequest, db: Session = Depends(get_db)):
    risk = predict_risk_score(
        persona=req.persona, city_tier=req.city_tier,
        avg_weekly_income=req.avg_weekly_income, experience_years=req.experience_years,
        active_hours=req.active_hours_per_day, weather_severity=0.3,
        social_disruption=0.1, aqi=100, rain_mm=10, temp_celsius=32,
        day_of_week=1, time_bucket=1, historical_claim_rate=req.historical_claim_rate,
    )
    w = Worker(
        id=str(uuid.uuid4()), user_id="",
        name=req.name, phone=req.phone, city=req.city,
        city_tier=req.city_tier, persona=req.persona, platform=req.platform,
        avg_weekly_income=req.avg_weekly_income, experience_years=req.experience_years,
        active_hours_per_day=req.active_hours_per_day,
        historical_claim_rate=req.historical_claim_rate,
        risk_score=risk["risk_score"], risk_level=risk["risk_level"],
        weekly_premium_inr=risk["weekly_premium_inr"],
        max_payout_inr=risk["max_payout_inr"],
        created_at=datetime.datetime.utcnow(),
    )
    db.add(w); db.commit(); db.refresh(w)
    return {"success": True, "worker": _w(w), **risk}

@router.get("/")
def list_workers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    ws = db.query(Worker).offset(skip).limit(limit).all()
    return {"total": db.query(Worker).count(), "workers": [_w(w) for w in ws]}

@router.get("/platforms/all")
def get_platforms():
    return {"food_delivery":["Zomato","Swiggy"],"quick_commerce":["Zepto","Blinkit","Swiggy Instamart"],
            "package_delivery":["Amazon Flex","Dunzo","Porter","Shadowfax"],
            "rideshare_uber":["Uber"],"rideshare_ola":["Ola"]}

@router.get("/{worker_id}")
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    w = db.query(Worker).filter(Worker.id == worker_id).first()
    if not w: raise HTTPException(404, "Worker not found")
    return _w(w)

def _w(w):
    return {"id":w.id,"user_id":w.user_id,"name":w.name,"phone":w.phone,"city":w.city,
            "city_tier":w.city_tier,"persona":w.persona,"platform":w.platform,
            "avg_weekly_income":w.avg_weekly_income,"experience_years":w.experience_years,
            "active_hours_per_day":w.active_hours_per_day,"historical_claim_rate":w.historical_claim_rate,
            "risk_score":w.risk_score,"risk_level":w.risk_level,
            "weekly_premium_inr":w.weekly_premium_inr,"max_payout_inr":w.max_payout_inr,
            "created_at":str(w.created_at)}
