🛡️ GigKavach (GigShield)  
AI-Driven Parametric Insurance for India's Gig Economy  
Guidewire DEVTrails 2026  University Hackathon  

---  

📌 Problem Statement  

India's gig workers (such as Zomato, Swiggy, Uber, etc.) Face a 20% to 30% drop in income because of disruptions such as rain, heatwaves, pollution, or strikes.

Custom Instructions:  
Do not paraphrase quotations.  

Paraphrased Text:  

- No permanent employer  
- No protection for income  
- Traditional insurance is slow, costly, and not appropriate  

---  

💡 Our Solution  

GigKavach is an AI-driven parametric insurance platform that:  

- Offers affordable weekly insurance (₹35₹95)  
- Uses AI to tailor risk assessment and pricing  
- Identifies disruptions through real-time APIs  
- Provides fast payouts (< 5 minutes via UPI)  

> ✅ No forms required  
> ✅ No need to submit claims manually  
> ✅ Entirely automated  

---  

🔄 System Workflow  

👷 Worker Process  
Register and complete KYC → Receive AI-based Risk Score → Purchase Weekly Insurance  
↓  
Disruption Identified (Automatically or Manually)  
↓  
Fraud Check → Claim Approved → Instant UPI Payment  

🧑‍💼 Admin Process  
Dashboard → View Workers → Manage Policies → Process Claims → Issue Payouts  
↓  
AI Risk Engine + Fraud Check + Analytics  

---  

🖥️ Main UI Features  

🏠 Worker Dashboard  
- Overview of earnings  
- Current insurance policy  
- Live updates on claims status

🤖 AI Premium Calculator  
- Risk assessment using PyTorch  
- Weekly insurance cost and payout  
- Transparent AI (highlighting key factors)  

💳 Purchase Policy  
- Choose coverage options (rain, heat, pollution)  
- Pricing that changes based on risk  
- Immediate activation through UPI  

📄 Submit a Claim  
- Submit claims manually  
- Or automatically triggered by weather data  

📊 Track Claim Status  
- Live updates on claim progress  
- Verification using AI  

🧠 Admin Dashboard  
- AI-based risk assessment system  
- Fraud detection (using Isolation Forest)  
- Automated claim processing system  

📈 Analytics Overview  
- Data on insured workers, claims, and payouts  
- Insights on fraud rates and system performance  

---

⚡ Parametric Insurance (Key Innovation)  

- Instant payment when specific conditions are met  
- Example: If rainfall exceeds 50mm/hr → automatic payout  

> ✅ No paperwork required  
> ✅ No waiting time  
> ✅ The event itself serves as proof  

---

🤖 AI and Machine Learning Models  

1️⃣ Risk Assessment (PyTorch)  
- Neural network with five layers  
- Thirteen input variables  
- Output: Risk score used to determine premium  

2️⃣ Fraud Detection (Isolation Forest)  
- Identifies unusual claim behavior  
- Helps stop false or repeated claims  

3️⃣ Claim Approval (Random Forest)  
- Predicts the likelihood of approval  
- Enables quick and accurate decisions

💰 Weekly Pricing Model  
Premium = Base Rate × City Tier × (1 + Risk Score × 0.9)  

- Range: ₹35  ₹95/week  
- Created for the weekly income of gig workers  

---  

🌐 Integrations  

- OpenWeather API → weather and air quality index  
- Platform APIs (simulated) → worker activity  
- UPI (mock) → payments  
- Traffic API (mock) → disruptions  

---  

🏗️ Tech Stack  

Frontend  
- React 18  
- Material UI  
- React Router  
- Axios  

Backend  
- FastAPI (Python)  
- SQLite / MongoDB  
- JWT Authentication  

AI/ML  
- PyTorch  
- Scikit-learn (Isolation Forest, Random Forest)  

---  

🔐 Security  

- Password hashing (bcrypt)  
- JWT-based authentication  
- No storage of unencrypted data  

---  

🚀 Key Features  

- Personalized pricing using AI  
- Real-time identification of disruptions  
- Automated claim handling  
- Fraud detection through machine learning  
- Immediate UPI payments  
- Dashboards based on user roles

🏆 Why GigKavach Stands Out

| Feature | Traditional Insurance | GigKavach |
|--------|---------------------|-----------|
| Target Users | Full-time employees | Freelancers and gig workers |
| Pricing | Monthly or yearly | Weekly |
| Claims | Handled manually and slowly | Processed automatically and instantly |
| Proof | Required | Not necessary |
| AI Usage | Not used | Uses advanced machine learning |
| Payout Time | Takes days or weeks | Less than 5 minutes |

---

🎯 Conclusion

GigKavach changes insurance from a slow, manual system into a fast, AI-powered, and automated protection solution for gig workers.

Designed for Guidewire DEVTrails 2026  Grow · Expand · Achieve Success
