"""
GigKavach ML Models
- PyTorch: Neural network for dynamic risk scoring & premium calculation
- Scikit-learn: Isolation Forest for fraud detection + Random Forest for claim validation
"""

import torch
import torch.nn as nn
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# ─────────────────────────────────────────────
# PyTorch Risk Scoring Neural Network
# ─────────────────────────────────────────────

class RiskScoringNet(nn.Module):
    """
    Multi-layer neural network that predicts income loss risk score (0-1)
    given worker profile + environmental/social disruption features.
    
    Input features (13):
      - persona_type (0-4): food/qcommerce/package/rideshare_uber/rideshare_ola
      - city_tier (1-3)
      - avg_weekly_income (normalized)
      - experience_years
      - active_hours_per_day
      - weather_severity (0-1): heat/rain/flood/pollution index
      - social_disruption (0-1): curfew/strike/zone-closure index
      - aqi (normalized 0-1)
      - rain_mm (normalized)
      - temp_celsius (normalized)
      - day_of_week (0-6)
      - time_of_day_bucket (0-3): morning/afternoon/evening/night
      - historical_claim_rate (0-1)
    """
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(13, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.net(x)


# ─────────────────────────────────────────────
# Singleton model loader
# ─────────────────────────────────────────────

_risk_model = None
_fraud_pipeline = None
_claim_classifier = None
_scaler = None

PERSONAS = {
    "food_delivery": 0,
    "quick_commerce": 1,
    "package_delivery": 2,
    "rideshare_uber": 3,
    "rideshare_ola": 4,
}

PERSONA_BASE_PREMIUM = {
    "food_delivery":     {"base": 45, "max_payout": 1500},
    "quick_commerce":    {"base": 40, "max_payout": 1200},
    "package_delivery":  {"base": 50, "max_payout": 1800},
    "rideshare_uber":    {"base": 60, "max_payout": 2500},
    "rideshare_ola":     {"base": 55, "max_payout": 2200},
}


def _build_and_train_risk_model() -> RiskScoringNet:
    """Train the PyTorch risk model on synthetic data."""
    model = RiskScoringNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()

    # Generate synthetic training data
    np.random.seed(42)
    n = 5000
    X = np.zeros((n, 13), dtype=np.float32)
    X[:, 0] = np.random.randint(0, 5, n)          # persona
    X[:, 1] = np.random.randint(1, 4, n) / 3.0    # city tier
    X[:, 2] = np.random.uniform(0.2, 1.0, n)      # avg weekly income norm
    X[:, 3] = np.random.uniform(0, 1, n)           # experience years norm
    X[:, 4] = np.random.uniform(0.3, 1.0, n)      # active hours
    X[:, 5] = np.random.beta(2, 5, n)              # weather severity
    X[:, 6] = np.random.beta(1, 8, n)              # social disruption
    X[:, 7] = np.random.uniform(0, 1, n)           # AQI norm
    X[:, 8] = np.random.exponential(0.2, n).clip(0,1)  # rain
    X[:, 9] = np.random.uniform(0.2, 0.9, n)      # temp norm
    X[:, 10] = np.random.randint(0, 7, n) / 6.0   # day of week
    X[:, 11] = np.random.randint(0, 4, n) / 3.0   # time bucket
    X[:, 12] = np.random.beta(1, 5, n)             # historical claim rate

    # Target: high risk when weather + social disruption is high
    y = (
        0.4 * X[:, 5] +
        0.3 * X[:, 6] +
        0.1 * X[:, 7] +
        0.1 * X[:, 8] +
        0.1 * X[:, 12] +
        np.random.normal(0, 0.05, n)
    ).clip(0, 1).astype(np.float32)

    X_tensor = torch.FloatTensor(X)
    y_tensor = torch.FloatTensor(y).unsqueeze(1)

    model.train()
    for epoch in range(30):
        optimizer.zero_grad()
        out = model(X_tensor)
        loss = criterion(out, y_tensor)
        loss.backward()
        optimizer.step()

    model.eval()
    return model


def _build_fraud_detector() -> Pipeline:
    """Scikit-learn Isolation Forest for anomaly/fraud detection in claims."""
    np.random.seed(42)
    n = 3000
    # Normal claims
    normal = np.column_stack([
        np.random.uniform(0.3, 0.8, n),   # claimed_loss_ratio
        np.random.uniform(0.2, 0.7, n),   # weather_severity at claim time
        np.random.uniform(0, 0.3, n),     # social_disruption
        np.random.randint(1, 8, n),       # hours_reported_lost
        np.random.uniform(0, 0.2, n),     # historical_fraud_score
        np.random.uniform(0.5, 1.0, n),   # location_match_score
    ])
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("iso_forest", IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42
        ))
    ])
    pipeline.fit(normal)
    return pipeline


def _build_claim_classifier() -> Pipeline:
    """Scikit-learn Random Forest for claim approval/rejection."""
    np.random.seed(42)
    n = 4000

    X = np.column_stack([
        np.random.uniform(0.1, 1.0, n),   # weather_severity
        np.random.uniform(0, 1, n),        # social_disruption
        np.random.uniform(0, 1, n),        # claimed_loss_ratio
        np.random.randint(1, 12, n),       # hours_lost
        np.random.uniform(0.3, 1.0, n),   # location_match_score
        np.random.uniform(0, 0.5, n),     # fraud_score
        np.random.uniform(0, 1, n),        # policy_age_weeks_norm
    ])
    # Approve if disruption is real + location matches + not fraudulent
    y = (
        (X[:, 0] > 0.4) &
        (X[:, 4] > 0.6) &
        (X[:, 5] < 0.3)
    ).astype(int)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42
        ))
    ])
    pipeline.fit(X, y)
    return pipeline


def get_risk_model() -> RiskScoringNet:
    global _risk_model
    if _risk_model is None:
        _risk_model = _build_and_train_risk_model()
    return _risk_model


def get_fraud_detector() -> Pipeline:
    global _fraud_pipeline
    if _fraud_pipeline is None:
        _fraud_pipeline = _build_fraud_detector()
    return _fraud_pipeline


def get_claim_classifier() -> Pipeline:
    global _claim_classifier
    if _claim_classifier is None:
        _claim_classifier = _build_claim_classifier()
    return _claim_classifier


# ─────────────────────────────────────────────
# Inference helpers
# ─────────────────────────────────────────────

def predict_risk_score(
    persona: str,
    city_tier: int,
    avg_weekly_income: float,
    experience_years: float,
    active_hours: float,
    weather_severity: float,
    social_disruption: float,
    aqi: float,
    rain_mm: float,
    temp_celsius: float,
    day_of_week: int,
    time_bucket: int,
    historical_claim_rate: float,
) -> dict:
    model = get_risk_model()
    features = torch.FloatTensor([[
        PERSONAS.get(persona, 0) / 4.0,
        city_tier / 3.0,
        min(avg_weekly_income / 5000, 1.0),
        min(experience_years / 10, 1.0),
        min(active_hours / 16, 1.0),
        weather_severity,
        social_disruption,
        min(aqi / 500, 1.0),
        min(rain_mm / 200, 1.0),
        (temp_celsius - 10) / 45,
        day_of_week / 6.0,
        time_bucket / 3.0,
        historical_claim_rate,
    ]])
    with torch.no_grad():
        risk_score = model(features).item()

    base = PERSONA_BASE_PREMIUM[persona]["base"]
    max_payout = PERSONA_BASE_PREMIUM[persona]["max_payout"]
    weekly_premium = round(base * (1 + risk_score * 0.8), 2)
    payout_amount = round(max_payout * risk_score * 0.7, 2)

    return {
        "risk_score": round(risk_score, 4),
        "risk_level": "HIGH" if risk_score > 0.65 else "MEDIUM" if risk_score > 0.35 else "LOW",
        "weekly_premium_inr": weekly_premium,
        "max_payout_inr": max_payout,
        "estimated_payout_inr": payout_amount,
    }


def detect_fraud(
    claimed_loss_ratio: float,
    weather_severity: float,
    social_disruption: float,
    hours_reported_lost: int,
    historical_fraud_score: float,
    location_match_score: float,
) -> dict:
    detector = get_fraud_detector()
    X = np.array([[
        claimed_loss_ratio,
        weather_severity,
        social_disruption,
        hours_reported_lost,
        historical_fraud_score,
        location_match_score,
    ]])
    pred = detector.predict(X)[0]
    score = detector.named_steps["iso_forest"].score_samples(
        detector.named_steps["scaler"].transform(X)
    )[0]
    is_fraud = pred == -1
    return {
        "is_fraud": bool(is_fraud),
        "anomaly_score": round(float(score), 4),
        "fraud_confidence": round(min(abs(score) * 0.8, 1.0), 4),
        "flag": "FLAGGED" if is_fraud else "CLEAN",
    }


def classify_claim(
    weather_severity: float,
    social_disruption: float,
    claimed_loss_ratio: float,
    hours_lost: int,
    location_match_score: float,
    fraud_score: float,
    policy_age_weeks: int,
) -> dict:
    clf = get_claim_classifier()
    X = np.array([[
        weather_severity,
        social_disruption,
        claimed_loss_ratio,
        hours_lost,
        location_match_score,
        fraud_score,
        min(policy_age_weeks / 52, 1.0),
    ]])
    pred = clf.predict(X)[0]
    proba = clf.predict_proba(X)[0]
    return {
        "approved": bool(pred == 1),
        "approval_probability": round(float(proba[1]), 4),
        "decision": "APPROVED" if pred == 1 else "REJECTED",
        "confidence": round(float(max(proba)), 4),
    }
