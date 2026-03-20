"""
Mock integrations for:
- Traffic data (simulated via city + time)
- Platform APIs (Zomato, Swiggy, Uber, Ola, Zepto, Amazon)
- Payment systems (UPI mock)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid, datetime, random

router = APIRouter(prefix="/integrations", tags=["Integrations"])

# ─────────────────────────────────────────────
# TRAFFIC DATA (Mock)
# ─────────────────────────────────────────────

CITY_TRAFFIC = {
    "Mumbai":      {"congestion": 0.82, "flood_zones": 3, "blocked_routes": 2},
    "Delhi":       {"congestion": 0.78, "flood_zones": 1, "blocked_routes": 4},
    "Bengaluru":   {"congestion": 0.75, "flood_zones": 0, "blocked_routes": 1},
    "Hyderabad":   {"congestion": 0.60, "flood_zones": 1, "blocked_routes": 0},
    "Chennai":     {"congestion": 0.65, "flood_zones": 2, "blocked_routes": 1},
    "Pune":        {"congestion": 0.55, "flood_zones": 0, "blocked_routes": 0},
    "Bhubaneswar": {"congestion": 0.40, "flood_zones": 1, "blocked_routes": 0},
    "Jaipur":      {"congestion": 0.50, "flood_zones": 0, "blocked_routes": 1},
    "Lucknow":     {"congestion": 0.58, "flood_zones": 1, "blocked_routes": 2},
    "Patna":       {"congestion": 0.62, "flood_zones": 2, "blocked_routes": 1},
}

@router.get("/traffic/{city}")
def get_traffic(city: str):
    """Mock traffic data for a city — affects delivery disruption score."""
    data = CITY_TRAFFIC.get(city, {"congestion": 0.50, "flood_zones": 0, "blocked_routes": 0})
    congestion = data["congestion"]
    social_disruption_factor = round(
        0.4 * congestion +
        0.3 * min(data["blocked_routes"] / 5, 1) +
        0.3 * min(data["flood_zones"] / 4, 1),
        3
    )
    return {
        "source": "mock",
        "city": city,
        "congestion_index": congestion,
        "congestion_level": "HIGH" if congestion > 0.7 else "MEDIUM" if congestion > 0.4 else "LOW",
        "flood_zones_affected": data["flood_zones"],
        "blocked_routes": data["blocked_routes"],
        "social_disruption_factor": social_disruption_factor,
        "advice": (
            "Severe traffic disruption — delivery may be impossible"
            if congestion > 0.75 else
            "Moderate congestion — expect delays"
            if congestion > 0.5 else
            "Normal traffic — deliveries unaffected"
        ),
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


# ─────────────────────────────────────────────
# PLATFORM APIs (Simulated)
# ─────────────────────────────────────────────

PLATFORM_DATA = {
    "Zomato":       {"active_workers": 12400, "avg_orders_per_day": 8,  "surge_active": True,  "platform_status": "operational"},
    "Swiggy":       {"active_workers": 11200, "avg_orders_per_day": 9,  "surge_active": False, "platform_status": "operational"},
    "Zepto":        {"active_workers": 4300,  "avg_orders_per_day": 12, "surge_active": True,  "platform_status": "operational"},
    "Blinkit":      {"active_workers": 3900,  "avg_orders_per_day": 11, "surge_active": False, "platform_status": "maintenance"},
    "Amazon Flex":  {"active_workers": 8700,  "avg_orders_per_day": 6,  "surge_active": False, "platform_status": "operational"},
    "Dunzo":        {"active_workers": 2100,  "avg_orders_per_day": 7,  "surge_active": False, "platform_status": "operational"},
    "Porter":       {"active_workers": 1800,  "avg_orders_per_day": 4,  "surge_active": False, "platform_status": "operational"},
    "Uber":         {"active_workers": 15600, "avg_orders_per_day": 14, "surge_active": True,  "platform_status": "operational"},
    "Ola":          {"active_workers": 13200, "avg_orders_per_day": 13, "surge_active": True,  "platform_status": "operational"},
}

@router.get("/platform/{platform_name}")
def get_platform_status(platform_name: str):
    """Simulated platform API — shows worker activity and surge status."""
    data = PLATFORM_DATA.get(platform_name)
    if not data:
        raise HTTPException(404, f"Platform '{platform_name}' not found")
    return {
        "source": "simulated",
        "platform": platform_name,
        "status": data["platform_status"],
        "active_workers_today": data["active_workers"] + random.randint(-200, 200),
        "avg_orders_per_worker_per_day": data["avg_orders_per_day"],
        "surge_pricing_active": data["surge_active"],
        "estimated_daily_income_inr": data["avg_orders_per_day"] * random.randint(55, 75),
        "disruption_flag": data["platform_status"] != "operational",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

@router.get("/platforms/all")
def list_platforms():
    return {
        "platforms": list(PLATFORM_DATA.keys()),
        "source": "simulated"
    }


# ─────────────────────────────────────────────
# PAYMENT SYSTEM (Mock UPI)
# ─────────────────────────────────────────────

class PaymentRequest(BaseModel):
    worker_id: str
    amount_inr: float
    upi_id: Optional[str] = None
    reason: str = "Insurance payout"
    claim_id: Optional[str] = None

class PremiumPaymentRequest(BaseModel):
    worker_id: str
    policy_id: str
    amount_inr: float
    method: str = "UPI"
    upi_id: Optional[str] = None

@router.post("/payment/payout")
def process_payout(req: PaymentRequest):
    """Mock UPI payout to worker after claim approval."""
    txn_id = "TXN" + str(uuid.uuid4()).replace("-","").upper()[:16]
    return {
        "source": "mock_upi",
        "status": "SUCCESS",
        "transaction_id": txn_id,
        "worker_id": req.worker_id,
        "amount_inr": req.amount_inr,
        "upi_id": req.upi_id or "worker@upi",
        "reason": req.reason,
        "claim_id": req.claim_id,
        "bank_reference": "NEFT" + str(random.randint(100000000, 999999999)),
        "processed_at": datetime.datetime.utcnow().isoformat(),
        "estimated_credit": "Within 5 minutes",
        "message": f"₹{req.amount_inr} successfully initiated to {req.upi_id or 'worker@upi'}",
    }

@router.post("/payment/premium")
def collect_premium(req: PremiumPaymentRequest):
    """Mock premium collection from worker."""
    txn_id = "PREM" + str(uuid.uuid4()).replace("-","").upper()[:14]
    return {
        "source": "mock_upi",
        "status": "SUCCESS",
        "transaction_id": txn_id,
        "worker_id": req.worker_id,
        "policy_id": req.policy_id,
        "amount_inr": req.amount_inr,
        "method": req.method,
        "processed_at": datetime.datetime.utcnow().isoformat(),
        "receipt": f"RCPT-{random.randint(10000,99999)}",
        "message": f"Premium of ₹{req.amount_inr} collected successfully",
    }

@router.get("/payment/methods")
def payment_methods():
    return {
        "supported": [
            {"id": "UPI", "name": "UPI", "providers": ["Google Pay", "PhonePe", "Paytm", "BHIM"]},
            {"id": "NEFT", "name": "Net Banking / NEFT", "providers": ["All Indian banks"]},
            {"id": "IMPS", "name": "IMPS", "providers": ["All Indian banks"]},
        ],
        "payout_time": "Within 5 minutes for UPI",
        "source": "mock"
    }
