# UK Day-Ahead Wind Forecast & Settlement Analytics

A clean, customized web application designed for UK energy utilities participating in the wholesale **Day-Ahead electricity market** (EPEX SPOT / Nord Pool). 

The platform empowers power procurement trading desks to:
1. **Accurately evaluate renewable wind generation forecasts** locked in at the D-1 Day-Ahead auction cutoff against actual delivery across all 48 half-hour Settlement Periods.
2. **Quantify forecast error mathematically** using market-standard statistical benchmarks (MAE, RMSE, Bias, WAPE, and empirical error quantiles).
3. **Optimize thermal power procurement decisions** by sizing safety margins that eliminate punitive System Buy Price (cash-out) imbalance penalties.

---

##  Deployment & Live Demo
- **Live Application URL**: `https://xxxxxxxxxxxxxxxxx` *(or your Heroku/Render instance)*
- **API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Video Walkthrough (Unlisted YouTube)**: `[Link to Video Demo]` 

---

##  Architecture & Tech Stack

```
[ Elexon BMRS Insights API ] 
  ├── FUELHH (Actual Half-Hourly Wind Generation)
  └── WINDFOR (Forecasted Wind Generation)
             │
      [ Python Ingestion Engine (backend/fetch_data.py) ]
             │
      [ Clean Local Parquet / JSON Cache (Jan 2026) ]
             │
      [ FastAPI Analytics & Settlement Engine ]
         ├── Day-Ahead Gate Closure Filter (D-1 11:00 GMT)
         ├── Settlement Period Alignment (SP 1–48 Interpolation)
         ├── Statistical & Quantile Calculator (SciPy / NumPy)
         └── Thermal Procurement Risk Simulator
             │
      [ React 18 + Vite + Tailwind CSS Frontend ]
         ├── Day-Ahead Decision Cockpit (Interactive Recharts Dual-Curve)
         ├── Accuracy & Distribution Suite (Histograms & Diurnal Profiles)
         └── Procurement Decision Support (Sizing Safety Buffers)
```

### Technology Highlights
* **Backend**: Python 3.11+, FastAPI, Pandas, NumPy, SciPy, Uvicorn, Pydantic, HTTPX.
* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
* **Containerization**: Docker (multi-stage) & Docker Compose.
* **Data Sources**: Official Elexon BMRS API (`FUELHH` and `WINDFOR` for January 2026).

---

##  Repository Structure

```text
.
├── Dockerfile                  # Unified single-container production build (Render/Heroku/Fly.io)
├── docker-compose.yml          # Multi-container orchestration (Backend + Frontend)
├── README.md                   # Full product, mathematical, and operational documentation
├── PRESENTATION_SCRIPT.md      # 10-minute video pitch & technical review script
├── backend/
│   ├── Dockerfile              # Python backend container definition
│   ├── fetch_data.py           # Automated Elexon BMRS data ingestion pipeline
│   ├── requirements.txt        # Python dependency manifest
│   ├── data/                   # Pre-cached January 2026 datasets
│   │   ├── fuelhh_jan2026.json # Actual wind generation (1,488 settlement periods)
│   │   └── windfor_jan2026.json# 19,856 forecast records across all publish cycles
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI entrypoint with CORS and static SPA serving
│       ├── config.py           # Energy market parameters & file paths
│       ├── data_loader.py      # D-1 gate closure filtering and SP 1–48 interpolation
│       ├── metrics.py          # Mathematical error calculations & financial cashout risk
│       └── router.py           # REST endpoints (/comparison, /month-summary, /simulate)
└── frontend/
    ├── Dockerfile              # Frontend multi-stage Nginx container
    ├── nginx.conf              # Nginx reverse proxy configuration
    ├── package.json            # Node.js dependencies
    ├── vite.config.ts          # Vite build configuration with API proxying
    ├── index.html              # Single page entry with metadata
    └── src/
        ├── App.tsx             # Root React application component
        ├── main.tsx            # React DOM mounting
        ├── index.css           # Tailwind CSS imports & theme rules
        ├── types/              # TypeScript interfaces & domain types
        ├── services/           # HTTP API client services
        └── components/
            ├── Navbar.tsx      # Header with branding and gate-closure selector
            ├── KpiCards.tsx    # High-impact summary cards (MAE, Bias, WAPE, Cashout Risk)
            ├── DayAheadCockpit.tsx # 48 settlement period interactive comparison chart & table
            ├── AccuracyAnalytics.tsx # Trends, error histograms, diurnal profiles, & quantiles
            └── ProcurementSimulator.tsx # Decision support simulator for thermal procurement
```

---

##  Mathematical Formulation & Energy Domain Concepts

### 1. The Day-Ahead Decision Problem
In the UK electricity market, power delivery is divided into **48 half-hour Settlement Periods (SP)** per day.
Traders submit purchase bids on Day $D-1$ before **Gate Closure** (typically **11:00 GMT** for the Day-Ahead auction).

To decide how much thermal/baseload electricity to procure:
$$\text{Thermal Procured}_t = \max(0, \text{Consumer Demand}_t - \text{Wind Forecast}_t)$$

### 2. Temporal Alignment (`publishTime` vs `startTime`)
* In `WINDFOR`, forecasts are continuously published throughout the day.
* To avoid look-ahead bias, our system filters strictly for the **latest forecast published at or before $D-1$ 11:00 GMT**:
  $$\text{publishTime} \le (D - 1\text{ day}) \text{ at 11:00:00Z}$$
* Because `WINDFOR` is published at hourly resolution while `FUELHH` is half-hourly, the backend employs **linear interpolation** to map hourly forecast points onto all 48 settlement periods.

### 3. Quantitative Error Benchmarks

| Metric | Formula | Market Significance |
| :--- | :--- | :--- |
| **Error ($e_t$)** | $e_t = \hat{y}_t - y_t$ | Over-forecast ($e_t > 0$) causes real-time power deficits; under-forecast ($e_t < 0$) causes surplus energy. |
| **Mean Absolute Error (MAE)** | $\frac{1}{N}\sum \|e_t\|$ | Average absolute MW deviation per half-hour period. |
| **Mean Forecast Bias (ME)** | $\frac{1}{N}\sum (\hat{y}_t - y_t)$ | Identifies whether the forecaster systematically over- or under-predicts. |
| **Root Mean Squared Error (RMSE)** | $\sqrt{\frac{1}{N}\sum e_t^2}$ | Penalizes large outlier errors that trigger severe cashout price spikes. |
| **Weighted Absolute Percentage Error (WAPE)** | $\frac{\sum \|e_t\|}{\sum y_t} \times 100\%$ | Industry standard for wind generation, avoiding the division-by-zero flaw of standard MAPE. |
| **Normalized MAE (NMAE)** | $\frac{\text{MAE}}{\text{Installed Capacity}} \times 100\%$ | Normalized against total UK wind capacity (~30,000 MW). |
| **Quantiles ($P_{10}, P_{50}, P_{90}$)** | $\text{Percentile}(e, q)$ | Parametric error margins used to determine thermal safety buffers. |

### 4. Cash-Out (Imbalance) Financial Risk
* **Short Imbalance**: When wind generation is over-forecasted ($e_t > 0$), the utility is short in real time and must buy balancing energy at the punitive **System Buy Price (SBP)** (~£85/MWh).
* **Long Imbalance**: When wind generation is under-forecasted ($e_t < 0$), surplus energy is dumped at the discounted **System Sell Price (SSP)** (~£45/MWh).

---

##  How to Run the Application

### Option A: Quickstart with Docker Compose (Recommended)
Make sure you have Docker installed, then run:

```bash
docker compose up --build
```
* **Frontend**: Open `http://localhost:3000` in your browser.
* **Backend API Docs**: Open `http://localhost:8000/docs`.

### Option B: Run Locally (Python + Node)

#### 1. Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# (Optional) Re-fetch latest January 2026 data from Elexon
python backend/fetch_data.py

# Start FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the live cockpit.

---

##  AI Tool Usage Disclosure
In accordance with assignment instructions, AI tools (Google Antigravity & Claude 3.5 Sonnet) were utilized to assist with scaffolding code structure, optimizing React/Tailwind styling, and authoring automated test suites. All data extraction, market mechanics, and mathematical formulations were thoroughly validated against official Elexon BMRS documentation.
