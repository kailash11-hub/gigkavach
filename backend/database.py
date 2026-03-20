"""
SQLite database setup using SQLAlchemy ORM.
Database file: gigkavach.db (auto-created in backend folder)
"""
from sqlalchemy import create_engine, Column, String, Float, Integer, Boolean, DateTime, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import enum

DATABASE_URL = "sqlite:///./gigkavach.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─────────────────────────────────────────────
# DB Models
# ─────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    worker = "worker"


class User(Base):
    __tablename__ = "users"
    id           = Column(String, primary_key=True, index=True)
    username     = Column(String, unique=True, index=True, nullable=False)
    email        = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role         = Column(String, default="worker")  # admin | worker
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.datetime.utcnow)


class Worker(Base):
    __tablename__ = "workers"
    id                   = Column(String, primary_key=True, index=True)
    user_id              = Column(String, index=True)
    name                 = Column(String, nullable=False)
    phone                = Column(String)
    city                 = Column(String)
    city_tier            = Column(Integer, default=2)
    persona              = Column(String)
    platform             = Column(String)
    avg_weekly_income    = Column(Float)
    experience_years     = Column(Float)
    active_hours_per_day = Column(Float)
    historical_claim_rate = Column(Float, default=0.0)
    risk_score           = Column(Float, default=0.0)
    risk_level           = Column(String, default="LOW")
    weekly_premium_inr   = Column(Float, default=0.0)
    max_payout_inr       = Column(Float, default=0.0)
    created_at           = Column(DateTime, default=datetime.datetime.utcnow)


class Policy(Base):
    __tablename__ = "policies"
    id                 = Column(String, primary_key=True, index=True)
    worker_id          = Column(String, index=True)
    worker_name        = Column(String)
    persona            = Column(String)
    platform           = Column(String)
    status             = Column(String, default="ACTIVE")
    weeks              = Column(Integer)
    weekly_premium_inr = Column(Float)
    total_premium_inr  = Column(Float)
    max_payout_inr     = Column(Float)
    risk_score         = Column(Float)
    risk_level         = Column(String)
    start_date         = Column(DateTime)
    end_date           = Column(DateTime)
    created_at         = Column(DateTime, default=datetime.datetime.utcnow)


class Claim(Base):
    __tablename__ = "claims"
    id                   = Column(String, primary_key=True, index=True)
    policy_id            = Column(String, index=True)
    worker_id            = Column(String, index=True)
    persona              = Column(String)
    disruption_type      = Column(String)
    disruption_subtype   = Column(String)
    description          = Column(Text, default="")
    weather_severity     = Column(Float)
    social_disruption    = Column(Float)
    claimed_loss_ratio   = Column(Float)
    hours_lost           = Column(Integer)
    location_match_score = Column(Float)
    fraud_flag           = Column(Boolean, default=False)
    fraud_score          = Column(Float, default=0.0)
    anomaly_score        = Column(Float, default=0.0)
    approval_probability = Column(Float, default=0.0)
    ml_confidence        = Column(Float, default=0.0)
    status               = Column(String, default="PENDING")
    payout_inr           = Column(Float, default=0.0)
    created_at           = Column(DateTime, default=datetime.datetime.utcnow)


class Payout(Base):
    __tablename__ = "payouts"
    id           = Column(String, primary_key=True, index=True)
    claim_id     = Column(String, index=True)
    worker_id    = Column(String, index=True)
    amount_inr   = Column(Float)
    method       = Column(String, default="UPI")
    status       = Column(String, default="PROCESSED")
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
