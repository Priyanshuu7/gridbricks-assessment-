import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

FUELHH_PATH = os.path.join(DATA_DIR, "fuelhh_jan2026.json")
WINDFOR_PATH = os.path.join(DATA_DIR, "windfor_jan2026.json")

# UK Day-Ahead auction gate closures typically happen at 11:00 or 12:00 GMT on D-1.
DEFAULT_GATE_CLOSURE_TIME = "11:00"

# Estimated UK average installed wind capacity (MW) during early 2026 for NMAE normalization
UK_WIND_INSTALLED_CAPACITY_MW = 30000.0

# Illustrative cashout prices (GBP/MWh) for risk quantification
DEFAULT_IMBALANCE_BUY_PRICE = 85.0   # Penalty for being short (under-procured)
DEFAULT_IMBALANCE_SELL_PRICE = 45.0  # Discount when dumping surplus (over-procured)
