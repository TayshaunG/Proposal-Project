from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from app.utils.predictor import load_models, predict_sample
import app as app_module

classify_bp = Blueprint("classify", __name__)

@classify_bp.route("/classify", methods=["POST"])
def classify():
    """
    Classify a single network traffic flow.

    Expected JSON body:
    {
        "features": [val1, val2, ..., val65]   // 65 numeric feature values
    }

    OR named features:
    {
        "named_features": {
            "Flow Duration": 123456,
            "Total Fwd Packets": 10,
            ...
        }
    }
    """
    try:
        models = load_models(current_app.config["ARTIFACTS_DIR"])
        feature_names = models["meta"]["feature_names"]

        data = request.get_json(force=True)

        # --- Accept either raw array or named dict ---
        if "features" in data:
            features = data["features"]
            if len(features) != len(feature_names):
                return jsonify({"error": f"Expected {len(feature_names)} features, got {len(features)}"}), 400

        elif "named_features" in data:
            nf = data["named_features"]
            features = [float(nf.get(name, 0)) for name in feature_names]

        else:
            return jsonify({"error": "Provide 'features' (array) or 'named_features' (dict)"}), 400

        result = predict_sample(models, features)

        # Build history record
        record = {
            "id":         len(app_module.classification_history) + 1,
            "timestamp":  datetime.now().isoformat(),
            "label":      result["final_label"],
            "confidence": result["confidence"],
            "if_label":   result["isolation_forest"]["label"],
            "rf_label":   result["random_forest"]["label"],
            "anomaly_score": result["isolation_forest"]["anomaly_score"],
        }

        # Append to history (cap at MAX_HISTORY)
        max_h = current_app.config["MAX_HISTORY"]
        if len(app_module.classification_history) >= max_h:
            app_module.classification_history.pop(0)
        app_module.classification_history.append(record)

        return jsonify({"status": "success", "result": result, "record": record}), 200

    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@classify_bp.route("/classify/batch", methods=["POST"])
def classify_batch():
    """
    Classify multiple flows at once.
    Body: { "samples": [ [f1,f2,...], [f1,f2,...] ] }
    """
    try:
        models  = load_models(current_app.config["ARTIFACTS_DIR"])
        data    = request.get_json(force=True)
        samples = data.get("samples", [])

        if not samples:
            return jsonify({"error": "No samples provided"}), 400

        results = []
        for i, features in enumerate(samples):
            result = predict_sample(models, features)
            record = {
                "id":            len(app_module.classification_history) + 1,
                "timestamp":     datetime.now().isoformat(),
                "label":         result["final_label"],
                "confidence":    result["confidence"],
                "if_label":      result["isolation_forest"]["label"],
                "rf_label":      result["random_forest"]["label"],
                "anomaly_score": result["isolation_forest"]["anomaly_score"],
            }
            app_module.classification_history.append(record)
            results.append({"index": i, "result": result})

        return jsonify({"status": "success", "count": len(results), "results": results}), 200

    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500
