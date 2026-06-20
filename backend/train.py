"""
train.py — Generate synthetic data, train Isolation Forest + Random Forest,
            save artifacts for the Flask API.

Run once before starting the server:
    python train.py

Tayshaun Gitonga | 193637 | CNS | Strathmore University
"""

import os, json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, roc_auc_score
)

np.random.seed(42)

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# ─────────────────────────────────────────────
# 1.  SYNTHETIC DATA GENERATION
# ─────────────────────────────────────────────

FEATURE_NAMES = [
    "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
    "Total Length of Fwd Packets", "Total Length of Bwd Packets",
    "Fwd Packet Length Max", "Fwd Packet Length Min",
    "Fwd Packet Length Mean", "Fwd Packet Length Std",
    "Bwd Packet Length Max", "Bwd Packet Length Min",
    "Bwd Packet Length Mean", "Bwd Packet Length Std",
    "Flow Bytes/s", "Flow Packets/s",
    "Flow IAT Mean", "Flow IAT Std", "Flow IAT Max", "Flow IAT Min",
    "Fwd IAT Total", "Fwd IAT Mean", "Fwd IAT Std", "Fwd IAT Max", "Fwd IAT Min",
    "Bwd IAT Total", "Bwd IAT Mean", "Bwd IAT Std", "Bwd IAT Max", "Bwd IAT Min",
    "Fwd PSH Flags", "Bwd PSH Flags", "Fwd URG Flags", "Bwd URG Flags",
    "Fwd Header Length", "Bwd Header Length",
    "Fwd Packets/s", "Bwd Packets/s",
    "Min Packet Length", "Max Packet Length",
    "Packet Length Mean", "Packet Length Std", "Packet Length Variance",
    "FIN Flag Count", "SYN Flag Count", "RST Flag Count",
    "PSH Flag Count", "ACK Flag Count", "URG Flag Count",
    "CWE Flag Count", "ECE Flag Count",
    "Down/Up Ratio", "Average Packet Size",
    "Avg Fwd Segment Size", "Avg Bwd Segment Size",
    "Subflow Fwd Packets", "Subflow Fwd Bytes",
    "Subflow Bwd Packets", "Subflow Bwd Bytes",
    "Init_Win_bytes_forward", "Init_Win_bytes_backward",
    "act_data_pkt_fwd", "min_seg_size_forward",
    "Active Mean", "Active Std", "Active Max", "Active Min",
]

N_FEATURES = len(FEATURE_NAMES)

def make_benign(n):
    rows = []
    for _ in range(n):
        r  = np.zeros(N_FEATURES)
        r[0]  = np.random.exponential(500000)            # Flow Duration
        r[1]  = np.random.randint(2, 30)                 # Fwd Packets
        r[2]  = np.random.randint(1, 25)                 # Bwd Packets
        r[3]  = max(0, np.random.normal(1200, 400))
        r[4]  = max(0, np.random.normal(900,  300))
        r[5]  = max(0, np.random.normal(800,  200))
        r[6]  = max(0, np.random.normal(40,    20))
        r[7]  = max(0, np.random.normal(400,  100))
        r[8]  = max(0, np.random.normal(150,   60))
        r[9]  = max(0, np.random.normal(700,  200))
        r[10] = max(0, np.random.normal(30,    15))
        r[11] = max(0, np.random.normal(350,  100))
        r[12] = max(0, np.random.normal(130,   50))
        r[13] = max(0, np.random.normal(15000, 5000))    # Flow Bytes/s
        r[14] = max(0, np.random.normal(50,    15))      # Flow Packets/s
        r[15] = max(0, np.random.normal(20000, 8000))
        r[16] = max(0, np.random.normal(10000, 4000))
        r[17] = max(0, np.random.normal(80000, 20000))
        r[18] = max(0, np.random.normal(500,   200))
        r[19] = max(0, np.random.normal(300000,80000))
        r[20] = max(0, np.random.normal(25000, 8000))
        r[21] = max(0, np.random.normal(12000, 4000))
        r[22] = max(0, np.random.normal(90000, 20000))
        r[23] = max(0, np.random.normal(600,   200))
        r[24] = max(0, np.random.normal(250000,70000))
        r[25] = max(0, np.random.normal(22000, 7000))
        r[26] = max(0, np.random.normal(11000, 4000))
        r[27] = max(0, np.random.normal(85000, 20000))
        r[28] = max(0, np.random.normal(550,   180))
        r[29] = np.random.randint(0, 2)   # PSH
        r[30] = np.random.randint(0, 2)
        r[31] = 0; r[32] = 0              # URG = 0 for normal
        r[33] = max(20, np.random.normal(120, 30))
        r[34] = max(20, np.random.normal(100, 25))
        r[35] = max(0, np.random.normal(25, 8))
        r[36] = max(0, np.random.normal(20, 7))
        r[37] = max(0, np.random.normal(40,  15))
        r[38] = max(0, np.random.normal(900, 200))
        r[39] = max(0, np.random.normal(380, 90))
        r[40] = max(0, np.random.normal(140, 50))
        r[41] = max(0, np.random.normal(19600,14000))
        r[42] = np.random.randint(0, 2)   # FIN
        r[43] = np.random.randint(0, 2)   # SYN
        r[44] = np.random.randint(0, 1)   # RST
        r[45] = np.random.randint(0, 3)   # PSH
        r[46] = np.random.randint(1, 5)   # ACK
        r[47] = 0; r[48] = 0; r[49] = 0  # URG/CWE/ECE
        r[50] = max(0, np.random.normal(1.2, 0.3))
        r[51] = max(0, np.random.normal(380, 90))
        r[52] = max(0, np.random.normal(400, 100))
        r[53] = max(0, np.random.normal(350, 90))
        r[54] = np.random.randint(1, 15)
        r[55] = max(0, np.random.normal(600, 200))
        r[56] = np.random.randint(1, 12)
        r[57] = max(0, np.random.normal(500, 180))
        r[58] = max(0, np.random.normal(8192, 2000))
        r[59] = max(0, np.random.normal(8192, 2000))
        r[60] = np.random.randint(1, 20)
        r[61] = max(8, np.random.normal(20, 5))
        r[62] = max(0, np.random.normal(50000, 15000))
        r[63] = max(0, np.random.normal(20000,  8000))
        r[64] = max(0, np.random.normal(120000,30000))
        r[65] = max(0, np.random.normal(10000,  4000)) if N_FEATURES > 65 else 0
        rows.append(r[:N_FEATURES])
    return np.array(rows), np.zeros(n, dtype=int)


def make_attack(n):
    rows = []
    labels = []
    n_ddos  = n // 3
    n_scan  = n // 3
    n_brute = n - n_ddos - n_scan

    # DDoS: tiny packets, massive rate, few backward
    for _ in range(n_ddos):
        r = np.zeros(N_FEATURES)
        r[0]  = np.random.exponential(5000)
        r[1]  = np.random.randint(100, 1000)
        r[2]  = np.random.randint(0, 5)
        r[3]  = max(0, np.random.normal(50,  10))
        r[4]  = max(0, np.random.normal(10,   5))
        r[5]  = max(0, np.random.normal(60,  15))
        r[6]  = max(0, np.random.normal(20,   5))
        r[7]  = max(0, np.random.normal(40,  10))
        r[8]  = max(0, np.random.normal(8,    3))
        r[9]  = max(0, np.random.normal(20,   5))
        r[13] = max(0, np.random.normal(2000000, 500000))
        r[14] = max(0, np.random.normal(5000, 1000))
        r[15] = max(0, np.random.normal(200,  50))
        r[43] = np.random.randint(1, 5)   # SYN
        r[50] = max(0, np.random.normal(0.01, 0.005))
        r[58] = max(0, np.random.normal(1024, 200))
        rows.append(r[:N_FEATURES]); labels.append(1)

    # Port Scan: SYN-only, zero backward, very short duration
    for _ in range(n_scan):
        r = np.zeros(N_FEATURES)
        r[0]  = np.random.exponential(1000)
        r[1]  = np.random.randint(1, 3)
        r[2]  = 0
        r[13] = max(0, np.random.normal(500, 100))
        r[14] = max(0, np.random.normal(1000, 200))
        r[43] = 1   # SYN only
        r[46] = 0   # no ACK
        r[50] = 0
        rows.append(r[:N_FEATURES]); labels.append(1)

    # Brute Force: moderate rate, repeated short flows, RST flags
    for _ in range(n_brute):
        r = np.zeros(N_FEATURES)
        r[0]  = np.random.exponential(200000)
        r[1]  = np.random.randint(5, 30)
        r[2]  = np.random.randint(3, 20)
        r[13] = max(0, np.random.normal(8000, 2000))
        r[14] = max(0, np.random.normal(200,  50))
        r[43] = 1   # SYN
        r[44] = np.random.randint(0, 2)   # RST
        rows.append(r[:N_FEATURES]); labels.append(1)

    return np.array(rows), np.array(labels, dtype=int)


# ─────────────────────────────────────────────
# 2.  GENERATE DATA
# ─────────────────────────────────────────────
print("=" * 55)
print("  NetGuard — Model Training")
print("  Tayshaun Gitonga | 193637 | Strathmore University")
print("=" * 55)

N_BENIGN = 8000
N_ATTACK = 2000
print(f"\n[1/5] Generating synthetic CICIDS2017-like data...")
print(f"      Benign samples : {N_BENIGN:,}")
print(f"      Attack samples : {N_ATTACK:,}")

X_b, y_b = make_benign(N_BENIGN)
X_a, y_a = make_attack(N_ATTACK)

X_all = np.vstack([X_b, X_a])
y_all = np.concatenate([y_b, y_a])

# Shuffle
idx = np.random.permutation(len(X_all))
X_all, y_all = X_all[idx], y_all[idx]

# ─────────────────────────────────────────────
# 3.  PREPROCESS
# ─────────────────────────────────────────────
print("\n[2/5] Preprocessing...")

# Remove zero-variance columns
stds = X_all.std(axis=0)
keep = stds > 0
X_all = X_all[:, keep]
feature_names_kept = [FEATURE_NAMES[i] for i in range(N_FEATURES) if keep[i]]
print(f"      Features retained: {len(feature_names_kept)} / {N_FEATURES}")

# Train / test split
X_train, X_test, y_train, y_test = train_test_split(
    X_all, y_all, test_size=0.2, random_state=42, stratify=y_all
)

# Scale
scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

# ─────────────────────────────────────────────
# 4.  TRAIN MODELS
# ─────────────────────────────────────────────
contamination = round(float(y_train.mean()), 3)
print(f"\n[3/5] Training models (contamination={contamination})...")

# Isolation Forest (unsupervised — trained on ALL features, no labels)
iso = IsolationForest(n_estimators=200, contamination=contamination,
                      random_state=42, n_jobs=-1)
iso.fit(X_train_sc)
print("      ✓ Isolation Forest trained")

# Random Forest (supervised — uses labels)
rf = RandomForestClassifier(n_estimators=200, max_depth=None,
                             class_weight="balanced", random_state=42, n_jobs=-1)
rf.fit(X_train_sc, y_train)
print("      ✓ Random Forest trained")

# ─────────────────────────────────────────────
# 5.  EVALUATE
# ─────────────────────────────────────────────
print("\n[4/5] Evaluating on test set...")

def eval_metrics(y_true, y_pred, y_score=None):
    m = {
        "accuracy":  round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
        "recall":    round(recall_score(y_true, y_pred, zero_division=0), 4),
        "f1":        round(f1_score(y_true, y_pred, zero_division=0), 4),
    }
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    m["false_positive_rate"] = round(fp / (fp + tn) if (fp + tn) > 0 else 0, 4)
    m["true_positive_rate"]  = round(tp / (tp + fn) if (tp + fn) > 0 else 0, 4)
    m["confusion_matrix"]    = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    if y_score is not None:
        m["roc_auc"] = round(roc_auc_score(y_true, y_score), 4)
    return m

# Isolation Forest
if_raw   = iso.predict(X_test_sc)
if_pred  = np.where(if_raw == -1, 1, 0)
if_score = -iso.decision_function(X_test_sc)
if_metrics = eval_metrics(y_test, if_pred, if_score)

# Random Forest
rf_pred  = rf.predict(X_test_sc)
rf_proba = rf.predict_proba(X_test_sc)[:, 1]
rf_metrics = eval_metrics(y_test, rf_pred, rf_proba)

print("\n      Isolation Forest:")
print(f"        Accuracy : {if_metrics['accuracy']}")
print(f"        F1 Score : {if_metrics['f1']}")
print(f"        ROC-AUC  : {if_metrics.get('roc_auc', 'N/A')}")
print(f"        FPR      : {if_metrics['false_positive_rate']}")

print("\n      Random Forest:")
print(f"        Accuracy : {rf_metrics['accuracy']}")
print(f"        F1 Score : {rf_metrics['f1']}")
print(f"        ROC-AUC  : {rf_metrics.get('roc_auc', 'N/A')}")
print(f"        FPR      : {rf_metrics['false_positive_rate']}")

# ─────────────────────────────────────────────
# 6.  SAVE ARTIFACTS
# ─────────────────────────────────────────────
print("\n[5/5] Saving artifacts...")

joblib.dump(iso,    os.path.join(ARTIFACTS_DIR, "isolation_forest.joblib"))
joblib.dump(rf,     os.path.join(ARTIFACTS_DIR, "random_forest.joblib"))
joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.joblib"))

metadata = {
    "feature_names":    feature_names_kept,
    "feature_count":    len(feature_names_kept),
    "training_samples": len(X_train),
    "test_samples":     len(X_test),
    "contamination":    contamination,
    "if_metrics":       if_metrics,
    "rf_metrics":       rf_metrics,
}

with open(os.path.join(ARTIFACTS_DIR, "metadata.json"), "w") as f:
    json.dump(metadata, f, indent=2)

print(f"      Artifacts saved to: {ARTIFACTS_DIR}/")
print("\n" + "=" * 55)
print("  ✓ Training complete. Run: python run.py")
print("=" * 55)
