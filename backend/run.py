import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("=" * 50)
    print(" NetGuard API — Starting on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
