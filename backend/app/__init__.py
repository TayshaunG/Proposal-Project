from flask import Flask
from flask_cors import CORS
from config import Config

# In-memory history store shared across blueprints
classification_history = []

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from app.routes.classify import classify_bp
    from app.routes.history  import history_bp
    from app.routes.stats    import stats_bp

    app.register_blueprint(classify_bp, url_prefix="/api")
    app.register_blueprint(history_bp,  url_prefix="/api")
    app.register_blueprint(stats_bp,    url_prefix="/api")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "NetGuard API is running"}

    return app
