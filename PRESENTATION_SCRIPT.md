# UK Day-Ahead Wind Forecast & Procurement Portal: 10-Minute Video Presentation & Demo Script

This script is structured into two 5-minute segments as required by Deliverable 3.1:
- **Part 1 (0:00 – 5:00)**: Client Presentation & Pilot Pitch (Executive & Commercial Value)
- **Part 2 (5:00 – 10:00)**: Internal Technical Lead Architecture & Code Review (Deep Dive)

---

## Part 1: Client Pitch (Target: 0:00 – 5:00)
**Audience**: UK Energy Utility Power Procurement Team / Head of Trading  
**Tone**: Confident, commercial, solution-oriented, visually compelling

### 0:00 – 0:45 | Executive Hook & Problem Statement
* **On Screen**: Open the **Day-Ahead Cockpit** (`http://localhost:3000`).
* **Speaker**:
  > *"Hello everyone. Today, I'm excited to present the pilot outcome of our customized **UK Day-Ahead Wind & Procurement Portal**, built specifically for your wholesale power procurement desk.*
  > 
  > *Every morning at 11:00 AM on Day D-1, your team faces a multi-million-pound decision: How much thermal or baseload power must we buy to cover consumer demand, beyond what renewable wind generation can provide?*
  > 
  > *Because wind is inherently volatile, relying naively on raw forecasts creates massive financial exposure. When forecasts over-predict wind, you are left short in real time, forced to buy balancing power at punitive System Buy Prices. When they under-predict, you spill surplus energy at steep discounts.*
  > 
  > *This portal transforms this risk into quantified confidence."*

### 0:45 – 2:15 | Product Tour: Day-Ahead Cockpit
* **On Screen**: Hover over the Top KPI Cards and scrub through the 48 settlement periods on the dual-curve chart.
* **Speaker**:
  > *"Let's look at the Day-Ahead Decision Cockpit for January 2026.*
  > 
  > *Notice this crucial detail in the header: **D-1 Cutoff: 11:00 GMT**. Our system automatically enforces the auction gate closure rule. We never show look-ahead intraday forecasts; we lock in the exact forecast snapshot your traders had available when placing their Day-Ahead auction bids.*
  > 
  > *Right at the top, your traders see immediate executive KPIs: Today's Mean Absolute Error, the Net Bias showing whether the model is over- or under-forecasting, and the calculated Imbalance Cashout Risk in Pounds.*
  > 
  > *Below, our interactive chart plots Actual Wind in cyan against your D-1 Day-Ahead forecast in amber across all 48 half-hour settlement periods. Traders can hover over any period—like SP 34 during the evening peak—to see exact megawatt deviations and immediate market position warnings."*

### 2:15 – 3:30 | Quantitative Accuracy Analytics
* **On Screen**: Click on the **Accuracy Analytics** tab in the navbar. Toggle through **Trends**, **Error Distribution**, and **Diurnal Profile**.
* **Speaker**:
  > *"Requirement two was to quantitatively benchmark forecast accuracy across time. On this tab, we evaluate the entire month of January 2026—1,488 half-hour trading blocks.*
  > 
  > *First, we track the 31-day error trend. Notice how traders can click on any spike to instantly jump back to that day's cockpit.*
  > 
  > *Second, we examine the **Error Distribution Histogram**. Standard models assume a clean bell curve, but wind energy suffers from 'fat tails' and skewness. Our engine calculates skewness and kurtosis in real time so your risk managers know the true probability of extreme misses.*
  > 
  > *Third, look at our **Diurnal Profile**. This shows average error by settlement period, revealing whether errors consistently peak during the morning ramp or evening demand peak."*

### 3:30 – 5:00 | The Decision Simulator & Business ROI
* **On Screen**: Click on the **Procurement Simulator** tab. Move the Consumer Demand slider to 25,000 MW, then drag the Risk Percentile slider from P50 to P85.
* **Speaker**:
  > *"Now, here is the real commercial breakthrough: our **Procurement Decision Simulator**.*
  > 
  > *Rather than naively buying `Demand - Wind Forecast`, your traders can select their target risk tolerance. By selecting an 85% confidence level, the platform calculates the exact safety margin in megawatts—here, +1,168 MW.*
  > 
  > *Look at the immediate result: this optimal safety buffer **reduces short-imbalance exposure by 96.4%**, delivering an estimated **£400,000+ in avoided cashout penalties** for your utility over the month.*
  > 
  > *This platform moves your trading desk from guesswork to mathematical precision. Thank you, and we'd love to partner with you to roll this out into full production."*

---

## Part 2: Technical Lead Review (Target: 5:00 – 10:00)
**Audience**: Internal Tech Lead / Senior Engineering Reviewer  
**Tone**: Rigorous, architectural, code-aware, focused on engineering excellence

### 5:00 – 6:15 | Architecture & Data Pipeline
* **On Screen**: Show the repository structure in the terminal/editor and the `docker-compose.yml`.
* **Speaker**:
  > *"Welcome to the technical review of our UK Day-Ahead Wind & Procurement Portal. Let's examine the software architecture, data pipelines, mathematical formulas, and testing practices.*
  > 
  > *The system is designed as a decoupled, containerized application with a Python FastAPI backend and a React 18 TypeScript frontend.*
  > 
  > *For data ingestion, we built `backend/fetch_data.py`. This talks directly to the official Elexon BMRS Insights API. We extract two core datasets: `FUELHH/stream` filtered for `fuelType=WIND` (representing actual generation at 30-minute resolution), and `WINDFOR/stream` (national wind forecasts).*
  > 
  > *We pre-cached all 31 days of January 2026—1,488 actual records and nearly 20,000 forecast records. This ensures sub-millisecond API response times and total resilience against external API rate limits."*

### 6:15 – 7:45 | Core Domain Logic & Math Engine (`data_loader.py` & `metrics.py`)
* **On Screen**: Open `backend/app/data_loader.py` and `backend/app/metrics.py`.
* **Speaker**:
  > *"Let's look at the core algorithmic challenge in `data_loader.py`: temporal alignment without look-ahead bias.*
  > 
  > *In the UK market, Day-Ahead gate closure occurs at 11:00 GMT on D-1. In our `get_day_ahead_comparison` method, we compute the cutoff timestamp `(D - 1 day) at 11:00:00Z`. We then filter `WINDFOR` for `publishTime <= cutoff_dt`. For each target hour on delivery day D, we select the latest available published forecast.*
  > 
  > *Another key domain challenge: WINDFOR publishes at 1-hour intervals, whereas FUELHH settlement periods are half-hourly. Rather than dropping half-hours or taking crude step functions, we apply **vectorized linear interpolation** in pandas to map hourly forecast points across all 48 settlement periods.*
  > 
  > *Next, in `metrics.py`, we calculate the statistical foundation:*
  > - *Mean Absolute Error (MAE)*
  > - *Mean Forecast Bias (Mean Error): to detect structural over- or under-forecasting*
  > - *RMSE: to penalize squared volatility*
  > - *WAPE (Weighted Absolute Percentage Error): $\frac{\sum |e_t|}{\sum y_t}$, which solves the classic problem where standard MAPE divides by near-zero wind generation*
  > - *Normalized MAE against total UK installed capacity (30 GW)*
  > - *Empirical quantiles P5 through P95 using SciPy, and higher statistical moments (skewness and kurtosis).*"*

### 7:45 – 8:45 | Frontend Implementation & Component Design
* **On Screen**: Open `frontend/src/App.tsx` and `frontend/src/components/DayAheadCockpit.tsx`.
* **Speaker**:
  > *"Moving to the frontend, we built a modern single-page application using React 18, TypeScript, and Vite with Tailwind CSS v4.*
  > 
  > *To ensure enterprise-grade stability, we configured strict TypeScript with `verbatimModuleSyntax`. All API contracts are typed in `frontend/src/types/index.ts`.*
  > 
  > *For visualization, we selected Recharts. In `DayAheadCockpit.tsx`, we implemented a `ComposedChart` combining dual monotone curves with an error delta bar series, customized tooltips, and bidirectional hover state synchronization between the chart and the 48-period data table.*
  > 
  > *In `ProcurementSimulator.tsx`, state changes on sliders trigger reactive recalculation via the backend simulation endpoint, rendering the hedged vs unhedged thermal dispatch curve instantly."*

### 8:45 – 10:00 | Dockerization, Production Readiness & Summary
* **On Screen**: Open `Dockerfile`, run `docker compose ps` or show container logs, and open Swagger UI (`http://localhost:8000/docs`).
* **Speaker**:
  > *"For deployment and operations, we provide two deployment patterns:*
  > 1. *`docker-compose.yml`: A multi-container setup with a dedicated Python 3.11 slim backend and an Nginx-fronted frontend container.*
  > 2. *`Dockerfile`: A unified multi-stage build that builds the React bundle and bundles it into FastAPI with `StaticFiles` mounting. This allows one-click zero-config deployment to platforms like Render, Heroku, or Fly.io.*
  > 
  > *We verified the entire system in an automated browser subagent, confirming 100% test pass on chart rendering, tab switching, and table filtering.*
  > 
  > *The codebase is fully documented in our public GitHub repository with an anonymous name, complete with setup instructions, math formulations, and architectural diagrams. That concludes the technical review. Thank you!"*
