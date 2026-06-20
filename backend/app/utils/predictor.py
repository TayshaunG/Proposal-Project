import os
import joblib
import numpy as np

# Cached models — loaded once on first request
_models = {}

def load_models(artifacts_dir):
    """Load trained models and scaler from disk. Cached after first load."""
    global _models
    if _models:
        return _models

    required = ["isolation_forest.joblib", "random_forest.joblib",
                "scaler.joblib", "metadata.json"]

    for fname in required:
        if not os.path.exists(os.path.join(artifacts_dir, fname)):
            raise FileNotFoundError(
                f"Model artifact '{fname}' not found in {artifacts_dir}. "
                "Please run train.py first."
            )

    import json
    _models["if"]   = joblib.load(os.path.join(artifacts_dir, "isolation_forest.joblib"))
    _models["rf"]   = joblib.load(os.path.join(artifacts_dir, "random_forest.joblib"))
    _models["scaler"] = joblib.load(os.path.join(artifacts_dir, "scaler.joblib"))
    with open(os.path.join(artifacts_dir, "metadata.json")) as f:
        _models["meta"] = json.load(f)

    return _models


def predict_sample(models, feature_values: list) -> dict:
    """
    Run a single feature vector through both models.
    Returns label, confidence, and both model outputs.
    """
    X = np.array(feature_values, dtype=float).reshape(1, -1)
    X_scaled = models["scaler"].transform(X)

    # --- Isolation Forest ---
    if_raw   = models["if"].predict(X_scaled)[0]        # +1 normal, -1 anomaly
    if_score = -models["if"].decision_function(X_scaled)[0]   # higher = more anomalous
    if_label = "ATTACK" if if_raw == -1 else "BENIGN"

    # --- Random Forest ---
    rf_label = models["rf"].predict(X_scaled)[0]        # "BENIGN" or "ATTACK"
    rf_proba = models["rf"].predict_proba(X_scaled)[0]  # [p_benign, p_attack]
    rf_conf  = float(max(rf_proba))

    # --- Consensus: if both agree → high confidence; if split → flag as ATTACK ---
    if if_label == rf_label:
        final_label = if_label
        confidence  = rf_conf
    else:
        final_label = "ATTACK"   # conservative: if either flags it, flag it
        confidence  = 0.55

    return {
        "final_label":        final_label,
        "confidence":         round(confidence, 4),
        "isolation_forest":   {"label": if_label, "anomaly_score": round(float(if_score), 4)},
        "random_forest":      {"label": rf_label, "confidence": round(rf_conf, 4)},
    }
