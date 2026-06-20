import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = "netguard-dev-key-2026"
    ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
    DATA_DIR      = os.path.join(BASE_DIR, "data")
    # History stored in memory (list) — simple for a project demo
    MAX_HISTORY   = 500
