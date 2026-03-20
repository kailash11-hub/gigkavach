# GigKavach 🛡️
### AI-Powered Parametric Insurance for India's Gig Economy
**Guidewire DEVTrails 2026 — University Hackathon**

---

## 📌 Problem Statement

India's gig workers (Zomato, Swiggy, Zepto, Amazon, Uber, Ola) form the backbone of our digital economy. External disruptions like extreme weather, floods, curfews, and strikes can reduce their working hours and cause **20–30% loss in monthly earnings**. Currently, gig workers have **zero income protection** against these uncontrollable events.

**GigKavach** is an AI-enabled parametric insurance platform that safeguards gig workers against income loss caused by external disruptions — with automated payouts, intelligent fraud detection, and a weekly pricing model aligned with their earnings cycle.

---

## 👤 Persona-Based Scenarios & Workflow

### Personas Covered

| Persona | Platforms | Key Risk |
|---------|-----------|----------|
| Food Delivery | Zomato, Swiggy | Heavy rain, floods halt deliveries |
| Quick Commerce | Zepto, Blinkit | Extreme heat, pollution stop work |
| Package Delivery | Amazon Flex, Dunzo, Porter | Curfews, strikes block zones |
| Rideshare (Uber) | Uber | Flooding, social unrest |
| Rideshare (Ola) | Ola | Extreme weather, bandh |

### Scenario Example — Ravi (Zomato Delivery Partner, Mumbai)

```
Day 1: Ravi registers on GigKavach
  → Completes KYC (Aadhaar + eShram + Identity Proof)
  → PyTorch model calculates risk score: 42% (MEDIUM)
  → Weekly premium assigned: ₹52/week

Day 2: Ravi buys a 4-week policy
  → Pays ₹208 via UPI
  → Policy activated instantly

Day 5: Heavy floods hit Mumbai (weather severity: 85%)
  → GigKavach auto-trigger detects the event
  → Claim filed automatically on Ravi's behalf
  → Isolation Forest confirms: not fraud
  → Random Forest approves: 91% confidence
  → ₹840 credited to Ravi's UPI within 5 minutes
  → Ravi never had to do anything
```

### Application Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKER JOURNEY                            │
├─────────────────────────────────────────────────────────────┤
│  1. Register & KYC  →  2. AI Risk Score  →  3. Buy Policy  │
│         ↓                                        ↓          │
│  Aadhaar + eShram        PyTorch Neural     Weekly UPI      │
│  + Identity Proof         Network           Payment         │
│                                ↓                            │
│            4. Disruption Detected (Auto or Manual)          │
│                                ↓                            │
│         5. AI Fraud Check  →  6. Instant UPI Payout        │
│         Isolation Forest      < 5 minutes                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ADMIN JOURNEY                             │
├─────────────────────────────────────────────────────────────┤
│  Dashboard → Workers → Policies → Claims → Payouts          │
│  Auto-Trigger Parametric Monitoring                         │
│  Fraud Detection Dashboard                                   │
│  Analytics & Risk Distribution                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Weekly Premium Model

### Why Weekly?
Gig workers are paid **weekly**, not monthly. A monthly premium creates cash flow problems. GigKavach aligns the premium cycle with their earnings cycle.

### How Premium is Calculated (PyTorch Neural Network)

```
Weekly Premium = Base Rate × City Tier Multiplier × (1 + Risk Score × 0.9)
```

**Base Rates by Persona:**
| Persona | Base Rate | Max Payout |
|---------|-----------|------------|
| Food Delivery | ₹45/week | ₹1,500 |
| Quick Commerce | ₹40/week | ₹1,200 |
| Package Delivery | ₹50/week | ₹1,800 |
| Rideshare Uber | ₹60/week | ₹2,500 |
| Rideshare Ola | ₹55/week | ₹2,200 |

**Risk Score (PyTorch 5-layer Neural Network, 13 features):**
```python
risk_score = (
    0.35 × weather_severity +
    0.35 × social_disruption +
    0.15 × historical_claim_rate +
    0.10 × (1 - experience_factor) +
    0.05 × (1 - hours_factor)
)
```

**Premium range: ₹35 – ₹95 per week**

---

## ⚡ Parametric Triggers

### What is a Parametric Trigger?
Unlike traditional insurance (where you prove your loss), parametric insurance pays automatically when a **pre-defined event** crosses a **threshold** — no paperwork needed.

### GigKavach Triggers

| Trigger Type | Event | Threshold | Auto-Payout |
|-------------|-------|-----------|-------------|
| Environmental | Extreme Heat | Temp > 42°C | Yes |
| Environmental | Heavy Rain | Rain > 50mm/hr | Yes |
| Environmental | Flash Flood | Severity > 70% | Yes |
| Environmental | Severe Pollution | AQI > 400 | Yes |
| Social | Curfew | Govt. declared | Yes |
| Social | Bandh / Strike | Verified report | Yes |
| Social | Zone Closure | Platform API | Yes |

### Real-time Monitoring
The auto-trigger system scans all active policies every hour:
```
Scan active policies → Check weather API → If severity > 70%
→ Auto-file claim → Fraud check → Approve → UPI payout
```

---

## 🤖 AI/ML Integration

### 1. Risk Assessment — PyTorch Neural Network
- **Architecture:** 5-layer fully connected network
- **Input features:** 13 (persona, city tier, income, experience, hours, weather severity, social disruption, AQI, rainfall, temperature, day of week, time bucket, claim history)
- **Output:** Risk score (0–1) → Premium amount
- **Training:** 5,000 synthetic samples, 80 epochs, BCELoss, Adam optimizer

### 2. Fraud Detection — Scikit-learn Isolation Forest
- **Algorithm:** Isolation Forest (unsupervised anomaly detection)
- **Features:** Claimed loss ratio, weather severity, social disruption, hours reported, historical fraud score, location match
- **Contamination rate:** 8%
- **Output:** Fraud flag (CLEAN / FLAGGED) + anomaly score

### 3. Claim Classification — Scikit-learn Random Forest
- **Algorithm:** Random Forest Classifier (100 trees, max depth 8)
- **Features:** Weather severity, social disruption, claimed loss ratio, hours lost, location match, fraud score, policy age
- **Output:** APPROVED / REJECTED + confidence score

### ML Pipeline Flow
```
Claim Filed
    ↓
Isolation Forest → Fraud Check (is_fraud: true/false)
    ↓
Random Forest → Approval Decision (probability: 0-1)
    ↓
If approved → Instant UPI Payout
```

---

## 🌐 Integrations

| Integration | Type | Purpose |
|------------|------|---------|
| OpenWeatherMap API | Live | Real-time weather severity, AQI, rainfall |
| Traffic Data | Mock | City congestion index, blocked routes |
| Platform APIs | Simulated | Zomato, Uber, Zepto worker activity data |
| UPI Payment | Mock/Sandbox | Premium collection + payout disbursement |

---

## 🏗️ Tech Stack

### Backend
```
FastAPI (Python)          — REST API framework
SQLite + SQLAlchemy       — Database + ORM
PyTorch 2.9+              — Neural network for risk scoring
Scikit-learn 1.4+         — Fraud detection + claim classification
python-jose               — JWT authentication
httpx                     — Async HTTP for weather API
Faker                     — Synthetic seed data generation
```

### Frontend
```
React 18                  — UI framework
Material UI (MUI) v5      — Component library
React Router v6           — Client-side routing
Axios                     — API calls
```

### Platform
```
Web Application           — Chosen over mobile for:
  - Faster development for hackathon scope
  - Better data visualization for admin dashboard
  - Accessible on any device via browser
  - Easier demo during presentation
```

---

## 📋 KYC Requirements

As per government guidelines for gig worker insurance:

1. **Aadhaar Number** — 12-digit UIDAI issued ID (validated)
2. **eShram Registration Number** — from eshram.gov.in (mandatory)
3. **Identity Proof** — One of:
   - Identity Card / Pay Slip issued by platform
   - Bank Statement
   - Voter ID / Driving License / Passport

---

## 🗂️ Project Structure

```
gigkavach/
├── backend/
│   ├── main.py                  ← FastAPI app + DB seeding
│   ├── database.py              ← SQLite models (User, Worker, Policy, Claim, Payout)
│   ├── auth.py                  ← JWT auth + password hashing
│   ├── requirements.txt
│   ├── ml/
│   │   └── risk_model.py        ← PyTorch + Scikit-learn models
│   ├── models/
│   │   └── schemas.py           ← Pydantic request schemas
│   └── routers/
│       ├── auth.py              ← Register, login, KYC
│       ├── workers.py           ← Onboarding + predict-risk
│       ├── policies.py          ← Weekly policy creation
│       ├── claims.py            ← Claims + auto-trigger + fraud
│       ├── analytics.py         ← Dashboard metrics
│       ├── weather.py           ← OpenWeatherMap integration
│       └── integrations.py     ← Traffic, Platform, Payment APIs
└── frontend/
    └── src/
        ├── App.jsx              ← Role-based routing (Worker/Admin)
        ├── pages/
        │   ├── LoginPage.jsx    ← 3-step KYC registration
        │   ├── Dashboard.jsx    ← Admin analytics
        │   ├── Workers.jsx      ← Worker management
        │   ├── Policies.jsx     ← Policy management
        │   ├── Claims.jsx       ← Claims + auto-trigger
        │   ├── Payouts.jsx      ← Payout tracking
        │   └── worker/
        │       ├── Landing.jsx          ← Product homepage
        │       ├── PremiumCalculator.jsx ← AI calculator + live weather
        │       ├── BuyPolicy.jsx        ← Policy purchase
        │       ├── FileClaim.jsx        ← Claim filing
        │       └── TrackStatus.jsx      ← Policy + claim tracking
        └── services/
            └── api.js           ← All API calls with JWT
```

---

## 🚀 Development Plan

### Phase 1 (March 4–20) ✅ COMPLETE
- [x] Core architecture design
- [x] PyTorch risk model training
- [x] Scikit-learn fraud detection
- [x] Basic worker onboarding
- [x] Weekly policy creation
- [x] SQLite database setup
- [x] JWT authentication
- [x] KYC document collection

### Phase 2 (Next)
- [ ] Improve ML model accuracy with real data
- [ ] Add mobile responsive design
- [ ] Real eShram API integration
- [ ] Real UPI payment gateway (Razorpay sandbox)
- [ ] Scheduled auto-trigger (APScheduler)
- [ ] Push notifications for payouts

---

## ▶️ How to Run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Default Credentials
- **Admin:** `admin` / `admin123`
- **API Docs:** http://127.0.0.1:8000/docs

---

## 🎯 Why GigKavach Wins

| | Traditional Insurance (LIC/TATA AIG) | GigKavach |
|--|--------------------------------------|-----------|
| Target user | Salaried employees | Gig workers specifically |
| Pricing | Monthly/Annual | **Weekly** |
| Claim process | File → Investigate → Pay (weeks) | **Auto-detect → Auto-pay (5 min)** |
| Proof needed | Documents, bills | **None — event is the proof** |
| AI/ML | None | **PyTorch + Isolation Forest + Random Forest** |
| Weather integration | None | **Live OpenWeatherMap API** |
| Fraud detection | Manual | **Automated anomaly detection** |

---

*Built for Guidewire DEVTrails 2026 — Seed · Scale · Soar*
