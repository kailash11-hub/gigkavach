from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db, User, Worker, Policy, Claim, Payout
from auth import hash_password
from routers import auth as auth_router
from routers import workers, policies, claims, analytics, weather, integrations
from ml.risk_model import get_risk_model, get_fraud_detector, get_claim_classifier
from sqlalchemy.orm import Session
import uuid, datetime

app = FastAPI(title="GigKavach API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    print("Initializing SQLite database...")
    init_db()
    _seed()
    print("Loading PyTorch Risk Model...")
    get_risk_model()
    print("Loading Isolation Forest...")
    get_fraud_detector()
    print("Loading Random Forest...")
    get_claim_classifier()
    print("GigKavach API v2.0 ready!")

def _seed():
    from faker import Faker
    import random
    db = next(get_db())
    fake = Faker("en_IN")
    random.seed(42)
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(id=str(uuid.uuid4()), username="admin", email="admin@gigkavach.com",
                    hashed_password=hash_password("admin123"), role="admin",
                    is_active=True, created_at=datetime.datetime.utcnow()))
        db.commit()
        print("Default admin: admin / admin123")
    if db.query(Worker).count() > 0:
        db.close(); return
    from ml.risk_model import predict_risk_score, PERSONAS
    PLATS = {"food_delivery":["Zomato","Swiggy"],"quick_commerce":["Zepto","Blinkit"],
             "package_delivery":["Amazon Flex","Dunzo","Porter"],"rideshare_uber":["Uber"],"rideshare_ola":["Ola"]}
    CITIES = [("Mumbai",1),("Delhi",1),("Bengaluru",1),("Hyderabad",1),("Pune",2),
              ("Jaipur",2),("Lucknow",2),("Bhubaneswar",2),("Patna",3)]
    persona_keys = list(PERSONAS.keys())
    worker_ids = []
    for _ in range(20):
        persona = random.choice(persona_keys)
        city,tier = random.choice(CITIES)
        platform = random.choice(PLATS[persona])
        income = round(random.uniform(1200,4500),2)
        exp = round(random.uniform(0.5,7),1)
        hours = round(random.uniform(6,14),1)
        cr = round(random.uniform(0,0.3),3)
        risk = predict_risk_score(persona=persona,city_tier=tier,avg_weekly_income=income,
            experience_years=exp,active_hours=hours,weather_severity=0.3,social_disruption=0.1,
            aqi=100,rain_mm=10,temp_celsius=32,day_of_week=1,time_bucket=1,historical_claim_rate=cr)
        uid = str(uuid.uuid4())
        uname = fake.user_name()+str(random.randint(10,99))
        db.add(User(id=uid,username=uname,hashed_password=hash_password("worker123"),
                    role="worker",is_active=True,created_at=datetime.datetime.utcnow()))
        wid = str(uuid.uuid4())
        w = Worker(id=wid,user_id=uid,name=fake.name(),phone=fake.phone_number(),
            city=city,city_tier=tier,persona=persona,platform=platform,
            avg_weekly_income=income,experience_years=exp,active_hours_per_day=hours,
            historical_claim_rate=cr,risk_score=risk["risk_score"],risk_level=risk["risk_level"],
            weekly_premium_inr=risk["weekly_premium_inr"],max_payout_inr=risk["max_payout_inr"],
            created_at=datetime.datetime.utcnow())
        db.add(w)
        worker_ids.append((wid,persona,platform,risk,w.name))
    db.commit()
    policy_ids = []
    for wid,persona,platform,risk,wname in worker_ids:
        weeks=random.randint(1,12)
        start=datetime.datetime.utcnow()-datetime.timedelta(weeks=random.randint(0,8))
        pid=str(uuid.uuid4())
        db.add(Policy(id=pid,worker_id=wid,worker_name=wname,persona=persona,platform=platform,
            status=random.choice(["ACTIVE","ACTIVE","ACTIVE","EXPIRED"]),weeks=weeks,
            weekly_premium_inr=risk["weekly_premium_inr"],
            total_premium_inr=round(risk["weekly_premium_inr"]*weeks,2),
            max_payout_inr=risk["max_payout_inr"],risk_score=risk["risk_score"],
            risk_level=risk["risk_level"],start_date=start,
            end_date=start+datetime.timedelta(weeks=weeks),created_at=start))
        policy_ids.append((pid,wid,persona))
    db.commit()
    DISRUPT=["Extreme Heat","Heavy Rain","Flash Flood","Severe Pollution","Curfew","Strike","Zone Closure"]
    for pid,wid,persona in policy_ids:
        for _ in range(random.randint(1,3)):
            fraud=random.random()<0.1
            approved=not fraud and random.random()>0.25
            payout=round(random.uniform(200,1800),2) if approved else 0
            cid=str(uuid.uuid4())
            db.add(Claim(id=cid,policy_id=pid,worker_id=wid,persona=persona,
                disruption_type=random.choice(["environmental","social"]),
                disruption_subtype=random.choice(DISRUPT),
                weather_severity=round(random.uniform(0.2,1),3),social_disruption=round(random.uniform(0,0.8),3),
                claimed_loss_ratio=round(random.uniform(0.2,0.9),3),hours_lost=random.randint(1,10),
                location_match_score=round(random.uniform(0.5,1),3),fraud_flag=fraud,
                fraud_score=round(random.uniform(0.6,0.99) if fraud else random.uniform(0,0.3),3),
                anomaly_score=round(random.uniform(-0.5,0),3),
                approval_probability=round(random.uniform(0.7,0.99) if approved else random.uniform(0.1,0.4),3),
                ml_confidence=round(random.uniform(0.7,0.99),3),
                status="APPROVED" if approved else ("FLAGGED" if fraud else "REJECTED"),
                payout_inr=payout,created_at=datetime.datetime.utcnow()-datetime.timedelta(days=random.randint(0,60))))
            if approved:
                db.add(Payout(id=str(uuid.uuid4()),claim_id=cid,worker_id=wid,
                    amount_inr=payout,method="UPI",status="PROCESSED",
                    processed_at=datetime.datetime.utcnow()))
    db.commit(); db.close()
    print("Seed data created.")

app.include_router(auth_router.router)
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(analytics.router)
app.include_router(weather.router)
app.include_router(integrations.router)

@app.get("/")
def root():
    return {"service":"GigKavach","version":"2.0.0","database":"SQLite",
            "default_admin":{"username":"admin","password":"admin123"}}

@app.get("/health")
def health(): return {"status":"healthy"}
