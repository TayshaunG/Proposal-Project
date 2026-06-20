from flask import Blueprint, jsonify, request
import app as app_module

history_bp = Blueprint("history", __name__)

@history_bp.route("/history", methods=["GET"])
def get_history():
    """Return classification history, newest first. Supports ?limit=N"""
    limit = request.args.get("limit", 100, type=int)
    history = list(reversed(app_module.classification_history))[:limit]
    return jsonify({
        "status":  "success",
        "total":   len(app_module.classification_history),
        "records": history
    }), 200


@history_bp.route("/history", methods=["DELETE"])
def clear_history():
    """Clear all classification history."""
    app_module.classification_history.clear()
    return jsonify({"status": "success", "message": "History cleared"}), 200
