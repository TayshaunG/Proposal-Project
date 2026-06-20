from flask import Blueprint, jsonify, current_app
from app.utils.predictor import load_models
import app as app_module

stats_bp = Blueprint("stats", __name__)

@stats_bp.route("/stats", methods=["GET"])
def get_stats():
    """
    Returns:
    - Model performance metrics (from training metadata)
    - Live session counts (from in-memory history)
    """
    try:
        models = load_models(current_app.config["ARTIFACTS_DIR"])
        meta   = models["meta"]

        history = app_module.classification_history
        total   = len(history)
        attacks = sum(1 for r in history if r["label"] == "ATTACK")
        benign  = total - attacks

        return jsonify({
            "status": "success",
            "model_metrics": {
                "random_forest": meta.get("rf_metrics", {}),
                "isolation_forest": meta.get("if_metrics", {}),
            },
            "feature_count":   meta.get("feature_count", 0),
            "training_samples": meta.get("training_samples", 0),
            "session": {
                "total_classified": total,
                "attacks_detected": attacks,
                "benign_traffic":   benign,
                "attack_rate":      round(attacks / total * 100, 1) if total > 0 else 0,
            }
        }), 200

    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stats_bp.route("/features", methods=["GET"])
def get_features():
    """Return list of feature names the model expects."""
    try:
        models = load_models(current_app.config["ARTIFACTS_DIR"])
        return jsonify({
            "status":   "success",
            "features": models["meta"]["feature_names"]
        }), 200
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
