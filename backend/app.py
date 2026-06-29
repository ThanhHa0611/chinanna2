
import os

from extensions import app, create_app

create_app()

if __name__ == "__main__":
    if os.getenv("SERVE_PUBLIC", "").strip() == "1":
        from public_routes import register_public_routes

        register_public_routes(app)

    host = os.getenv("FLASK_HOST", "127.0.0.1").strip() or "127.0.0.1"
    port = int(os.getenv("FLASK_PORT", "8000"))
    app.run(host=host, port=port, debug=True)
