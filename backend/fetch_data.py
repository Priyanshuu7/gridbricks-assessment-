"""
fetch_data.py
Script to fetch and cache actual generation (FUELHH) and wind forecast (WINDFOR) 
datasets from the Elexon BMRS API for January 2026.
"""

import os
import json
import time
import httpx
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

FUELHH_CACHE = os.path.join(DATA_DIR, "fuelhh_jan2026.json")
WINDFOR_CACHE = os.path.join(DATA_DIR, "windfor_jan2026.json")

BMRS_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

def fetch_fuelhh():
    print("Fetching FUELHH (Actual Wind Generation) for Jan 2026...")
    url = f"{BMRS_BASE_URL}/datasets/FUELHH/stream"
    params = {
        "settlementDateFrom": "2026-01-01",
        "settlementDateTo": "2026-01-31",
        "fuelType": "WIND"
    }
    
    with httpx.Client(timeout=60.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        records = resp.json()
        print(f"Retrieved {len(records)} FUELHH WIND records.")
        with open(FUELHH_CACHE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2)
        print(f"Saved to {FUELHH_CACHE}")
    return records

def fetch_windfor():
    print("Fetching WINDFOR (Forecasted Wind Generation) for Jan 2026...")
    url = f"{BMRS_BASE_URL}/datasets/WINDFOR/stream"
    
    # Range of publish times needed:
    # Day-Ahead decisions for Jan 1 delivery are taken on Dec 31 2025.
    # Day-Ahead decisions taken on Jan 31 2026 for Feb 1 delivery.
    start_dt = datetime(2025, 12, 30, 0, 0, 0)
    end_dt = datetime(2026, 2, 2, 0, 0, 0)
    
    all_records = []
    chunk_days = 4
    current_dt = start_dt
    
    with httpx.Client(timeout=60.0) as client:
        while current_dt < end_dt:
            next_dt = min(current_dt + timedelta(days=chunk_days), end_dt)
            params = {
                "publishDateTimeFrom": current_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "publishDateTimeTo": next_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
            print(f"  Fetching chunk {params['publishDateTimeFrom']} -> {params['publishDateTimeTo']}...")
            try:
                resp = client.get(url, params=params)
                resp.raise_for_status()
                records = resp.json()
                print(f"    Got {len(records)} records.")
                all_records.extend(records)
            except Exception as e:
                print(f"    Error fetching chunk: {e}")
            current_dt = next_dt
            time.sleep(0.5)

    print(f"Total WINDFOR records fetched: {len(all_records)}")
    with open(WINDFOR_CACHE, "w", encoding="utf-8") as f:
        json.dump(all_records, f)
    print(f"Saved to {WINDFOR_CACHE}")
    return all_records

if __name__ == "__main__":
    fetch_fuelhh()
    fetch_windfor()
