# 🌡️ Aarogya — Urban Heatwave Early Warning & Monitoring System

> **Ward-level heat vulnerability indexing, ML-powered risk prediction, targeted multi-channel alerts, and real-time monitoring for Jaipur, India.**

[![SIH 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange?style=for-the-badge)](https://www.sih.gov.in/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)]()

---

## 💡 The Problem

Heatwaves are India's **deadliest natural disaster** — killing more people annually than floods, cyclones, and earthquakes combined. Yet every warning today is **generic and city-wide**: a slum resident with no fan and an office worker with AC receive the **same** alert. There is no ward-level targeting, no vulnerability weighting, and no feedback loop to measure response effectiveness.

## 🎯 Our Solution

**Aarogya** is a full-stack heatwave early warning system that asks three questions _per ward_:

1. **Who lives here?** — Demographics, elderly %, outdoor workers, green cover (Heat Vulnerability Index)
2. **How hot will it get?** — MODIS satellite LST + Open-Meteo 72-hour weather + XGBoost ML predictions
3. **What should we do about it?** — Automated, targeted SMS/voice alerts only to at-risk wards, with cooling center routing

> _Same forecast → different vulnerability → different risk tier → different response._

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                         │
│  Google Earth Engine (MODIS LST) · Open-Meteo (72hr hourly weather) │
│  Census/Ward Demographics · GeoJSON Ward Boundaries                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                     AI / ML SERVICE (FastAPI)                        │
│  XGBoost Pipeline (trained on Jaipur historical data)               │
│  TemporalFeatureEngineer → 72hr rolling stats → 3-class prediction  │
│  Classes: Low (No Heatwave) · Mild Heatwave · Extreme Heatwave     │
│  GEE satellite temp injection into current-hour prediction          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  writes predictions to MongoDB
┌───────────────────────────────▼─────────────────────────────────────┐
│                   BACKEND API (Express.js)                           │
│  Ward CRUD · DailyRisk · Alert Logs · Resources · Feedback          │
│  node-cron Watcher (30s) → Twilio SMS dispatch · Deduplicated       │
│  Simulation endpoint for live demo override                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                FRONTEND DASHBOARD (React + Vite)                     │
│  Authority Dashboard · Interactive Risk Map (Leaflet)                │
│  Alert Management · Analytics · Shelters & Resources                 │
│  Emergency Response · Citizen Reports · Citizen View                 │
│  Live/Demo Data Stream Toggle · Mobile-responsive Bottom Nav         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI & Machine Learning
- **XGBoost Classification Pipeline** trained on Jaipur historical weather data (2009–2023)
- **TemporalFeatureEngineer** — custom sklearn transformer that builds 72-hour rolling statistics, lag features, cyclical time encodings, and diurnal range features
- **3-class heatwave prediction**: Low (< 40°C HI), Mild (40–45°C), Extreme (≥ 45°C)
- **Google Earth Engine integration** — live MODIS satellite Land Surface Temperature injected into predictions
- **Open-Meteo fallback** — graceful degradation when GEE is unavailable

### 🗺️ Interactive Risk Map
- **Leaflet-based ward map** with color-coded risk tiers (Low → Moderate → Severe → Extreme)
- **Ward polygons** with popup details: HVI score, forecast temperature, population, vulnerability factors
- Real-time updates when risk tiers change

### 🚨 Alert System
- **Automated Twilio SMS dispatch** triggered by node-cron background watcher (30-second intervals)
- **Deduplicated alerts** — each ward/date/tier/recipient combination only fires once
- **Alert log dashboard** — full history with status tracking (sent/failed/skipped)
- Configurable recipient phone numbers via environment variables

### 📊 Analytics & Dashboards
- **Authority Dashboard** — aggregate risk overview, ward stat cards, system status strip
- **Analytics Page** — Recharts-powered temperature trends and risk distribution charts
- **Shelters & Resources** — cooling centers, water stations, medical camps with capacity tracking
- **Emergency Response** — emergency protocol management and readiness tracking
- **Citizen Reports** — heat illness and infrastructure issue feedback from the public

### 🔄 Simulation Mode
- **Live ↔ Demo toggle** — switch between real-time satellite data (~26°C) and peak summer heatwave scenario (45°C benchmark)
- **Per-ward simulation** — force any ward to a specific risk tier for live demo presentations
- Non-destructive: simulated data is flagged with `isSimulated: true`

### 📱 Responsive Design
- **Desktop**: Full navbar with segmented pill navigation + data stream switcher
- **Mobile**: Bottom tab bar + hamburger sidebar with all navigation links
- Dark mode UI with glassmorphism effects, Tailwind CSS v4

---

## 📂 Project Structure

```
aarogya-heatwave-ews/
├── ai-service/                     # Python FastAPI — ML predictions & satellite data
│   ├── app/
│   │   ├── main.py                 # FastAPI app, XGBoost pipeline, GEE/Open-Meteo clients
│   │   ├── models/schemas.py       # Pydantic request/response schemas
│   │   ├── routers/risk.py         # Risk assessment endpoints
│   │   ├── services/
│   │   │   ├── hvi_model.py        # Heat Vulnerability Index computation
│   │   │   ├── risk_fusion.py      # HVI + forecast → risk tier fusion
│   │   │   ├── weather_client.py   # Open-Meteo API client
│   │   │   └── gee_client.py       # Google Earth Engine satellite client
│   │   └── scheduler/              # APScheduler auto-recompute jobs
│   ├── saved_models/
│   │   ├── urban_heatwave_pipeline.pkl   # Trained XGBoost pipeline (~2.7 MB)
│   │   └── label_encoder.pkl             # Label encoder for predictions
│   ├── train_local.py              # Local model training script
│   ├── jaipur.csv.zip              # Historical Jaipur weather dataset
│   ├── Dockerfile                  # Production container (Python 3.10-slim)
│   └── requirements.txt
│
├── backend/                        # Express.js — REST API & alert dispatch
│   ├── src/
│   │   ├── server.js               # App entry, MongoDB connect, route mounting
│   │   ├── routes/                 # 7 route modules
│   │   │   ├── wards.routes.js     # Ward CRUD + latest risk join
│   │   │   ├── risk.routes.js      # Risk history & latest endpoints
│   │   │   ├── alerts.routes.js    # Alert log queries
│   │   │   ├── resources.routes.js # Cooling centers & resource management
│   │   │   ├── feedback.routes.js  # Citizen feedback submission
│   │   │   ├── emergency.routes.js # Emergency response endpoints
│   │   │   └── simulate.routes.js  # Demo simulation trigger
│   │   ├── controllers/            # Business logic for each route
│   │   ├── models/                 # Mongoose schemas (Ward, DailyRisk, AlertLog, Resource, Feedback)
│   │   ├── services/
│   │   │   ├── twilioService.js    # Twilio SMS/voice dispatch
│   │   │   └── firebaseService.js  # Firebase Cloud Messaging push
│   │   ├── jobs/
│   │   │   └── riskWatcher.cron.js # node-cron: check risks → dispatch alerts (30s)
│   │   ├── middleware/             # Error handling middleware
│   │   └── utils/                  # Phone normalization & helpers
│   ├── Dockerfile                  # Production container (Node 18-alpine)
│   └── .env.example
│
├── frontend/                       # React 18 + Vite — dashboard & citizen UI
│   ├── src/
│   │   ├── App.jsx                 # Root layout, routing, nav, data stream toggle
│   │   ├── pages/                  # 8 full pages
│   │   │   ├── AuthorityDashboard  # Main command center with stat cards
│   │   │   ├── RiskMapPage         # Interactive Leaflet ward risk map
│   │   │   ├── AlertsPage          # Alert history & management
│   │   │   ├── AnalyticsPage       # Recharts data visualizations
│   │   │   ├── SheltersPage        # Cooling center & resource tracking
│   │   │   ├── EmergencyPage       # Emergency response protocols
│   │   │   ├── CitizenReportsPage  # Public feedback & illness reports
│   │   │   └── CitizenPage         # Public-facing simplified view
│   │   ├── components/             # 12 reusable component modules
│   │   │   ├── Map/                # Leaflet map with ward polygons
│   │   │   ├── Dashboard/          # Dashboard widgets
│   │   │   ├── StatCards/          # Risk metric cards
│   │   │   ├── LiveAlerts/         # Real-time alert feed
│   │   │   ├── SimulationToggle/   # Live ↔ Demo mode switcher
│   │   │   ├── AIPrediction/       # ML prediction display
│   │   │   ├── Sidebar/            # Mobile navigation drawer
│   │   │   ├── Logo/               # Aarogya brand component
│   │   │   ├── CitizenView/        # Citizen-facing components
│   │   │   ├── FeedbackForm/       # Heat report submission form
│   │   │   ├── EmergencyShelters/  # Shelter locator & capacity
│   │   │   └── ResponseReadiness/  # Response status indicators
│   │   ├── context/                # React Context (AppContext for global state)
│   │   ├── hooks/                  # Custom hooks (useMLPrediction)
│   │   ├── services/api.js         # Axios API client (all backend calls)
│   │   └── styles/                 # Global CSS & Tailwind config
│   └── package.json
│
├── scripts/                        # Database seeding & testing utilities
│   ├── seed-db.js                  # Seeds 6 Jaipur wards + 9 resources + daily risks
│   ├── simulate-heatwave.js        # CLI heatwave simulation trigger
│   └── test-system.py              # End-to-end system integration test
│
├── docs/                           # Project documentation
│   ├── ARCHITECTURE.md             # Architecture decisions & HVI formula
│   ├── API_CONTRACTS.md            # MongoDB schemas & REST endpoint specs
│   ├── DEMO_SCRIPT.md              # 2-minute stage demo walkthrough
│   └── PITCH_DECK.md               # Slide-by-slide pitch outline
│
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Satellite Data** | Google Earth Engine (MODIS/061/MOD11A1) | Live Land Surface Temperature |
| **Weather Forecast** | Open-Meteo API | 72-hour hourly weather (free, no API key) |
| **ML Pipeline** | XGBoost + scikit-learn + Pandas + NumPy | Heatwave classification (3-class) |
| **AI Service** | FastAPI + Uvicorn | ML prediction API (port 8000) |
| **Backend API** | Express.js + Mongoose | REST API + alert dispatch (port 5000) |
| **Database** | MongoDB Atlas (M0 free tier) | Wards, risks, alerts, resources, feedback |
| **SMS Alerts** | Twilio | Automated SMS to at-risk ward recipients |
| **Push Notifications** | Firebase Cloud Messaging | Mobile push alerts |
| **Frontend** | React 18 + Vite | SPA dashboard |
| **Maps** | Leaflet + react-leaflet | Interactive ward risk map |
| **Charts** | Recharts | Analytics visualizations |
| **UI Framework** | Tailwind CSS v4 + Framer Motion | Styling + animations |
| **Icons** | Lucide React | Consistent iconography |
| **Containerization** | Docker | Production-ready Dockerfiles for AI + Backend |

---

## 🚀 Quick Start (Windows)

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10+ | With `pip` |
| Node.js | 18+ | With `npm` |
| MongoDB | Atlas (free) or local | [Create free cluster](https://www.mongodb.com/atlas) |
| Google Earth Engine | Cloud project | Optional — system falls back to Open-Meteo |

### 1. Clone & Navigate

```powershell
git clone <your-repo-url>
cd urban-heatwave-ews
```

### 2. AI Service (FastAPI — Port 8000)

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env          # Fill in MONGO_URI, GEE credentials
uvicorn app.main:app --reload --port 8000
```

The trained XGBoost pipeline (`saved_models/urban_heatwave_pipeline.pkl`) is pre-included. To retrain on fresh data:

```powershell
python train_local.py           # Trains on jaipur.csv.zip, saves new pipeline
```

### 3. Backend (Express.js — Port 5000)

```powershell
cd backend
npm install
copy .env.example .env          # Fill in MONGO_URI, Twilio, Firebase credentials
npm run dev
```

### 4. Frontend (React + Vite — Port 5173)

```powershell
cd frontend
npm install
npm run dev
```

### 5. Seed the Database

```powershell
cd scripts
node seed-db.js
```

This seeds **6 Jaipur wards** (Malviya Nagar, Mansarovar, C-Scheme, Vaishali Nagar, Sanganer Industrial, Amer Old City), **9 cooling resources**, and initial daily risk assessments.

---

## 🔑 Environment Variables

### AI Service (`ai-service/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `GEE_PROJECT_ID` | No | Google Earth Engine Cloud project ID |
| `GEE_SERVICE_ACCOUNT_KEY` | No | Path to GEE service account JSON key |

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `PORT` | No | Server port (default: `5000`) |
| `AI_SERVICE_URL` | No | FastAPI URL (default: `http://localhost:8000`) |
| `TWILIO_ACCOUNT_SID` | Yes* | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes* | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Yes* | Twilio verified sender number |
| `MY_PHONE_NUMBER` | No | Primary demo alert recipient |
| `DEMO_RECIPIENT` | No | Secondary demo alert recipient |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | No | Path to Firebase Admin SDK JSON key |

> \* Required for SMS alerts. The system still runs without Twilio — alerts will log as `failed`.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | Backend URL (default: `http://localhost:5000/api`) |
| `VITE_AI_SERVICE_URL` | No | AI service URL (default: `http://localhost:8000`) |

---

## 🧪 Demo Wards (Jaipur)

| Ward ID | Name | Population | Elderly % | Outdoor Workers % | Green Cover % |
|---------|------|------------|-----------|-------------------|---------------|
| JPR-W01 | Malviya Nagar | 45,000 | 18% | 22% | 14% |
| JPR-W02 | Mansarovar | 78,000 | 12% | 35% | 8% |
| JPR-W03 | C-Scheme / Civil Lines | 32,000 | 15% | 15% | 25% |
| JPR-W04 | Vaishali Nagar | 52,000 | 14% | 28% | 12% |
| JPR-W05 | Sanganer Industrial | 68,000 | 9% | 48% | 5% |
| JPR-W06 | Amer Old City | 41,000 | 20% | 38% | 18% |

---

## 📡 API Reference

### Express Backend (`localhost:5000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/wards` | All wards with latest risk tier |
| `GET` | `/api/wards/:wardId` | Single ward details |
| `GET` | `/api/wards/:wardId/risk` | Risk history for a ward |
| `GET` | `/api/risk/latest` | Latest risk for all wards |
| `GET` | `/api/alerts` | Recent alert logs (last 50) |
| `GET` | `/api/alerts?wardId=X` | Alerts for specific ward |
| `GET` | `/api/resources` | All cooling centers & resources |
| `GET` | `/api/resources?type=cooling_center` | Filter resources by type |
| `PUT` | `/api/resources/:id` | Update resource occupancy/status |
| `POST` | `/api/feedback` | Submit citizen heat report |
| `GET` | `/api/emergency` | Emergency response data |
| `POST` | `/api/simulate` | Force ward risk tier (demo) |

### FastAPI AI Service (`localhost:8000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (model status, GEE, DB) |
| `POST` | `/api/predict` | ML heatwave prediction for coordinates |
| `POST` | `/internal/recompute` | Force ML pipeline recompute |

---

## 🐳 Docker Deployment

Both services include production-ready Dockerfiles:

```powershell
# AI Service
cd ai-service
docker build -t aarogya-ai .
docker run -p 8000:8000 --env-file .env aarogya-ai

# Backend
cd backend
docker build -t aarogya-backend .
docker run -p 5000:5000 --env-file .env aarogya-backend
```

**Recommended deployment platforms:** Render, Railway, or any Docker-compatible PaaS.

---

## 🧠 ML Model Details

| Attribute | Value |
|-----------|-------|
| **Algorithm** | XGBoost Classifier |
| **Pipeline** | `TemporalFeatureEngineer` → `XGBClassifier` |
| **Training Data** | Jaipur hourly weather (2009–2023) |
| **Features** | Temperature, humidity, pressure, wind, dew point, cloud cover |
| **Engineered Features** | 72hr rolling means/max/min, lag features, cyclical hour encoding, diurnal range |
| **Target Classes** | 0 = Low (< 40°C HI), 1 = Mild (40–45°C), 2 = Extreme (≥ 45°C) |
| **Hyperparameters** | `n_estimators=241, max_depth=7, learning_rate=0.0408` |
| **Train/Valid/Test Split** | ≤2017 / 2018 / ≥2019 (temporal split) |
| **Serialization** | `joblib` (pickle-compatible pipeline) |

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [Architecture Decisions](docs/ARCHITECTURE.md) | HVI formula, risk tier thresholds, tech choices |
| [API Contracts](docs/API_CONTRACTS.md) | MongoDB schemas + REST endpoint specifications |
| [Demo Script](docs/DEMO_SCRIPT.md) | 2-minute stage demo walkthrough with fallbacks |
| [Pitch Deck Outline](docs/PITCH_DECK.md) | 10-slide pitch structure for judges |

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| **Backend Lead** | Express API, MongoDB schemas, Twilio/Firebase alert dispatch, cron watcher |
| **AI/Data Lead** | FastAPI service, GEE integration, XGBoost pipeline, HVI model, risk fusion |
| **Frontend Lead** | React app, react-leaflet risk map, simulation toggle, routing |
| **Frontend/UX** | Recharts dashboards, citizen page, responsive design, visual polish |
| **Integration/QA** | Service wiring, end-to-end testing, Docker deployment, demo script |

---

## 🗺️ Future Roadmap

- [ ] Voice/IVR alerts in Hindi and regional languages (Twilio Programmable Voice)
- [ ] Prophet/LSTM time-series forecasting layer (v2 model upgrade)
- [ ] Municipal partnership for real-time cooling center occupancy feeds
- [ ] PWA with push notification opt-in for citizens
- [ ] National scaling with automated city onboarding (plug in city GeoJSON + census data)
- [ ] WhatsApp Business API integration for alert delivery
- [ ] Historical risk heatmap playback for urban planning insights

---

## 📝 License

This project was built for **Smart India Hackathon 2026 — SIET Internal Qualifier**.

---

<p align="center">
  <strong>「 Predictive · Targeted · Equitable 」</strong><br/>
  <em>Aarogya — Urban Heatwave Early Warning & Monitoring System</em>
</p>