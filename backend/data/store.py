"""Simple in-memory store + seed data generator."""
import uuid, random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker("en_IN")
random.seed(42)

PERSONAS = ["food_delivery", "quick_commerce", "package_delivery", "rideshare_uber", "rideshare_ola"]
PLATFORMS = {
    "food_delivery": ["Zomato", "Swiggy"],
    "quick_commerce": ["Zepto", "Blinkit", "Swiggy Instamart"],
    "package_delivery": ["Amazon Flex", "Dunzo", "Porter", "Shadowfax"],
    "rideshare_uber": ["Uber"],
    "rideshare_ola": ["Ola"],
}
CITIES = [("Mumbai", 1), ("Delhi", 1), ("Bengaluru", 1), ("Hyderabad", 1),
          ("Pune", 2), ("Jaipur", 2), ("Lucknow", 2), ("Bhubaneswar", 2),
          ("Mysuru", 3), ("Patna", 3)]

workers = {}
policies = {}
claims = {}
payouts = {}

def _gen_workers(n=40):
    for _ in range(n):
        wid = str(uuid.uuid4())
        persona = random.choice(PERSONAS)
        city, tier = random.choice(CITIES)
        platform = random.choice(PLATFORMS[persona])
        workers[wid] = {
            "id": wid,
            "name": fake.name(),
            "phone": fake.phone_number(),
            "city": city,
            "city_tier": tier,
            "persona": persona,
            "platform": platform,
            "avg_weekly_income": round(random.uniform(1200, 4500), 2),
            "experience_years": round(random.uniform(0.5, 7), 1),
            "active_hours_per_day": round(random.uniform(6, 14), 1),
            "historical_claim_rate": round(random.uniform(0, 0.3), 3),
            "created_at": (datetime.now() - timedelta(days=random.randint(10, 300))).isoformat(),
            "risk_score": round(random.uniform(0.1, 0.85), 4),
            "risk_level": random.choice(["LOW", "MEDIUM", "HIGH"]),
            "weekly_premium_inr": round(random.uniform(35, 95), 2),
        }

def _gen_policies():
    for wid, w in list(workers.items()):
        pid = str(uuid.uuid4())
        weeks = random.randint(1, 12)
        start = datetime.now() - timedelta(weeks=random.randint(0, 10))
        policies[pid] = {
            "id": pid,
            "worker_id": wid,
            "persona": w["persona"],
            "status": random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "EXPIRED"]),
            "weeks": weeks,
            "weekly_premium_inr": w["weekly_premium_inr"],
            "total_premium_inr": round(w["weekly_premium_inr"] * weeks, 2),
            "max_payout_inr": round(random.uniform(800, 3000), 2),
            "start_date": start.isoformat(),
            "end_date": (start + timedelta(weeks=weeks)).isoformat(),
        }

def _gen_claims():
    policy_list = list(policies.values())
    disruptions = ["Extreme Heat", "Heavy Rain", "Flood", "Severe Pollution",
                   "Unplanned Curfew", "Local Strike", "Zone Closure"]
    for _ in range(60):
        pol = random.choice(policy_list)
        cid = str(uuid.uuid4())
        fraud_flag = random.random() < 0.1
        approved = not fraud_flag and random.random() > 0.2
        payout_amt = round(random.uniform(200, 1800), 2) if approved else 0
        claims[cid] = {
            "id": cid,
            "policy_id": pol["id"],
            "worker_id": pol["worker_id"],
            "disruption": random.choice(disruptions),
            "weather_severity": round(random.uniform(0.1, 1.0), 3),
            "social_disruption": round(random.uniform(0, 0.8), 3),
            "claimed_loss_ratio": round(random.uniform(0.2, 0.9), 3),
            "hours_lost": random.randint(1, 10),
            "fraud_flag": fraud_flag,
            "fraud_score": round(random.uniform(0.6, 0.99) if fraud_flag else random.uniform(0, 0.3), 3),
            "status": "APPROVED" if approved else ("FLAGGED" if fraud_flag else "REJECTED"),
            "payout_inr": payout_amt,
            "created_at": (datetime.now() - timedelta(days=random.randint(0, 60))).isoformat(),
        }

_gen_workers()
_gen_policies()
_gen_claims()
