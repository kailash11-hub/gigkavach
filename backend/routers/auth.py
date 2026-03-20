"""
Authentication routes:
POST /auth/register    - Register new worker
POST /auth/login       - Login worker or admin -> JWT
GET  /auth/me          - Get current user
POST /auth/create-admin - Create admin (one-time setup)
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid, datetime

from database import get_db, User, Worker
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

ADMIN_SECRET = "gigkavach_admin_2026"

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = "Delhi"
    city_tier: Optional[int] = 2
    persona: Optional[str] = "food_delivery"
    platform: Optional[str] = "Zomato"
    avg_weekly_income: Optional[float] = 2500
    experience_years: Optional[float] = 1
    active_hours_per_day: Optional[float] = 8

class LoginRequest(BaseModel):
    username: str
    password: str

class AdminCreateRequest(BaseModel):
    username: str
    password: str
    secret_key: str


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "Username already taken.")
    if req.email and db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered.")

    from ml.risk_model import predict_risk_score
    PLATFORMS = {"food_delivery":"Zomato","quick_commerce":"Zepto","package_delivery":"Amazon Flex","rideshare_uber":"Uber","rideshare_ola":"Ola"}
    persona = req.persona or "food_delivery"
    platform = req.platform or PLATFORMS.get(persona, "Zomato")
    risk = predict_risk_score(
        persona=persona, city_tier=req.city_tier or 2,
        avg_weekly_income=req.avg_weekly_income or 2500,
        experience_years=req.experience_years or 1,
        active_hours=req.active_hours_per_day or 8,
        weather_severity=0.3, social_disruption=0.1,
        aqi=100, rain_mm=10, temp_celsius=32,
        day_of_week=1, time_bucket=1, historical_claim_rate=0.0,
    )

    uid = str(uuid.uuid4())
    user = User(id=uid, username=req.username, email=req.email,
                hashed_password=hash_password(req.password), role="worker",
                is_active=True, created_at=datetime.datetime.utcnow())
    db.add(user)

    worker = Worker(
        id=str(uuid.uuid4()), user_id=uid,
        name=req.name or req.username, phone=req.phone or "",
        city=req.city or "Delhi", city_tier=req.city_tier or 2,
        persona=persona, platform=platform,
        avg_weekly_income=req.avg_weekly_income or 2500,
        experience_years=req.experience_years or 1,
        active_hours_per_day=req.active_hours_per_day or 8,
        historical_claim_rate=0.0,
        risk_score=risk["risk_score"], risk_level=risk["risk_level"],
        weekly_premium_inr=risk["weekly_premium_inr"],
        max_payout_inr=risk["max_payout_inr"],
        created_at=datetime.datetime.utcnow(),
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)

    token = create_access_token({"sub": user.username, "role": "worker", "worker_id": worker.id})
    return {
        "access_token": token, "token_type": "bearer",
        "role": "worker", "username": user.username,
        "worker": {"id": worker.id, "name": worker.name, "city": worker.city,
                   "persona": worker.persona, "platform": worker.platform,
                   "risk_score": worker.risk_score, "risk_level": worker.risk_level,
                   "weekly_premium_inr": worker.weekly_premium_inr,
                   "max_payout_inr": worker.max_payout_inr,
                   "avg_weekly_income": worker.avg_weekly_income,
                   "experience_years": worker.experience_years,
                   "active_hours_per_day": worker.active_hours_per_day,
                   "historical_claim_rate": worker.historical_claim_rate}
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid username or password.")
    if not user.is_active:
        raise HTTPException(403, "Account is disabled.")

    extra = {}
    if user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == user.id).first()
        if worker:
            extra["worker"] = {
                "id": worker.id, "name": worker.name, "city": worker.city,
                "persona": worker.persona, "platform": worker.platform,
                "risk_score": worker.risk_score, "risk_level": worker.risk_level,
                "weekly_premium_inr": worker.weekly_premium_inr,
                "max_payout_inr": worker.max_payout_inr,
                "avg_weekly_income": worker.avg_weekly_income,
                "experience_years": worker.experience_years,
                "active_hours_per_day": worker.active_hours_per_day,
                "historical_claim_rate": worker.historical_claim_rate,
            }
            extra["worker_id"] = worker.id

    token = create_access_token({"sub": user.username, "role": user.role, **extra})
    return {"access_token": token, "token_type": "bearer",
            "role": user.role, "username": user.username, **extra}


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = {"id": current_user.id, "username": current_user.username,
            "email": current_user.email, "role": current_user.role}
    if current_user.role == "worker":
        worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
        if worker:
            data["worker"] = {"id": worker.id, "name": worker.name, "city": worker.city,
                              "persona": worker.persona, "platform": worker.platform,
                              "risk_score": worker.risk_score, "risk_level": worker.risk_level,
                              "weekly_premium_inr": worker.weekly_premium_inr,
                              "max_payout_inr": worker.max_payout_inr}
    return data


@router.post("/create-admin")
def create_admin(req: AdminCreateRequest, db: Session = Depends(get_db)):
    if req.secret_key != ADMIN_SECRET:
        raise HTTPException(403, "Invalid secret key.")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "Username already taken.")
    admin = User(id=str(uuid.uuid4()), username=req.username,
                 hashed_password=hash_password(req.password),
                 role="admin", is_active=True, created_at=datetime.datetime.utcnow())
    db.add(admin)
    db.commit()
    return {"success": True, "message": f"Admin '{req.username}' created."}
