from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db, User, Worker, Policy, Claim, Payout
from auth import hash_password
from routers import auth as auth_router
from routers import workers, policies, claims, analytics, weather, integrations
from ml.risk_model import get_risk_model, get_fraud_detector, get_claim_classifier
import uuid, datetime

app = FastAPI(title="GigKavach API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ FAST STARTUP (ONLY DB)
@app.on_event("startup")
async def startup():
    print("Initializing database...")
    init_db()

    print("Seeding data...")
    _seed()   # ✅ ADD THIS LINE

    print("Startup complete!")

# ❌ DISABLED (too slow for Render)
# _seed()

# 🔥 LAZY LOAD ML MODELS
risk_model = None
fraud_model = None
claim_model = None

def load_risk():
    global risk_model
    if risk_model is None:
        print("Loading Risk Model...")
        risk_model = get_risk_model()
    return risk_model

def load_fraud():
    global fraud_model
    if fraud_model is None:
        print("Loading Fraud Detector...")
        fraud_model = get_fraud_detector()
    return fraud_model

def load_claim():
    global claim_model
    if claim_model is None:
        print("Loading Claim Classifier...")
        claim_model = get_claim_classifier()
    return claim_model

# 👉 KEEP YOUR SEED FUNCTION (but don't run on startup)
def _seed():
    pass  # keep your original code if needed locally

# ROUTERS
app.include_router(auth_router.router)
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(analytics.router)
app.include_router(weather.router)
app.include_router(integrations.router)

@app.get("/")
def root():
    return {
        "service": "GigKavach",
        "version": "2.0.0",
        "status": "running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
