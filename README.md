# GigKavach 🛡️
### AI-Powered Parametric Insurance for India’s Gig Economy
Guidewire DEVTrails 2026 — University Hackathon

---

## 📌 Problem Statement

India’s gig workers (Zomato, Swiggy, Uber, Ola, Amazon Flex, Zepto etc.) often lose income due to disruptions such as heavy rain, floods, heatwaves, pollution, curfews or strikes.

Traditional insurance:
- Is monthly or yearly
- Requires paperwork and proof
- Takes weeks for claim settlement
- Is not designed for gig workers

Gig workers need **fast, affordable, automated income protection.**

---

## 💡 Solution — GigKavach

GigKavach is an **AI-driven parametric insurance platform** that protects gig workers from income loss caused by external disruptions.

Key Features:
- Weekly insurance pricing (₹35 – ₹95)
- AI-based personalized risk scoring
- Real-time disruption detection
- Automated claim approval
- Instant payout via UPI (< 5 minutes)
- Fraud detection using ML models

✅ No manual claim filing  
✅ No document verification after event  
✅ Event itself becomes proof  

---

## 🔄 Worker Journey

1. Worker registers and completes KYC  
2. AI model calculates risk score  
3. Weekly premium is assigned  
4. Worker purchases policy  
5. Disruption occurs (rain / flood / strike etc.)  
6. Claim auto-triggered  
7. Fraud check + approval  
8. Instant payout credited  

---

## 🧑‍💼 Admin Journey

- Dashboard monitoring
- Worker management
- Policy tracking
- Claims analytics
- Fraud detection insights
- Risk distribution visualization

---

## ⚡ Parametric Triggers

Automatic payout happens when thresholds are crossed:

- Rainfall > 50 mm/hr  
- Temperature > 42°C  
- AQI > 400  
- Flood severity > 70%  
- Government declared curfew  
- Verified strike / bandh  

---

## 🤖 AI / ML Architecture

### 1️⃣ Risk Assessment — PyTorch Neural Network
- 5 Layer Fully Connected Model
- 13 input features
- Output → Risk Score (0–1)
- Used for premium calculation

### 2️⃣ Fraud Detection — Isolation Forest
- Detects abnormal claims
- Prevents false payout attempts

### 3️⃣ Claim Approval — Random Forest
- Predicts claim approval probability
- Enables fast automated decisions

---

## 💰 Weekly Pricing Model
Premium = Base Rate × City Tier × (1 + Risk Score × 0.9)

Range: **₹35 – ₹95 per week**

Designed for **weekly earning cycle of gig workers.**

---

## 🌐 Integrations

- OpenWeatherMap API → weather severity + rainfall + AQI
- Mock Traffic API → congestion / blockage
- Platform APIs (simulated) → worker activity
- UPI Sandbox → premium collection + payouts

---

## 🏗️ Tech Stack

### Frontend
- React 18
- Material UI
- React Router
- Axios

### Backend
- FastAPI
- SQLite + SQLAlchemy
- JWT Authentication
- Async API Calls (httpx)

### AI / ML
- PyTorch
- Scikit-learn (Isolation Forest + Random Forest)

---

## 📁 Project Structure
gigkavach/
│
├── backend/
│ ├── main.py
│ ├── database.py
│ ├── auth.py
│ ├── requirements.txt
│ ├── ml/
│ ├── models/
│ └── routers/
│
└── frontend/
└── src/

---

## ▶️ How to Run Locally

### Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload


### Frontend

cd frontend
npm install
npm start


---

## 🎯 Vision

GigKavach transforms insurance from **slow manual protection → instant AI-powered income security** for millions of gig workers in India.

---

Built for Guidewire DEVTrails 2026  
Seed • Scale • Soar