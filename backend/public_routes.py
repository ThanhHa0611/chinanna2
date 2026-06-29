import json
from pathlib import Path

from flask import redirect, request, send_from_directory

PUBLIC_ROOT = Path(__file__).resolve().parent.parent / "deploy" / "public"
LANDING_ROOT = Path(__file__).resolve().parent.parent / "deploy" / "landing"
PUBLIC_PATHS_FILE = Path(__file__).resolve().parent.parent / "deploy" / "public_paths.json"
TUNNEL_HOSTS_FILE = Path(__file__).resolve().parent / "tunnel_hosts.json"

APP_FOLDERS = {
    "mentee": "mentee",
    "mentor": "mentor",
    "superadmin": "superadmin",
}

DEFAULT_PUBLIC_PATHS = {
    "mentee": "hskjchaihldkajj",
    "mentor": "hjgafjkshdgfahjkkjcsdhkk",
    "superadmin": "yaghkcjhaiuhahjks",
}


def _load_public_paths() -> dict[str, str]:
    if PUBLIC_PATHS_FILE.is_file():
        try:
            data = json.loads(PUBLIC_PATHS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return {
                    role: str(data.get(role, slug)).strip("/")
                    for role, slug in DEFAULT_PUBLIC_PATHS.items()
                }
        except (OSError, json.JSONDecodeError):
            pass
    return dict(DEFAULT_PUBLIC_PATHS)


def _load_tunnel_hosts() -> dict:
    if not TUNNEL_HOSTS_FILE.is_file():
        return {}
    try:
        data = json.loads(TUNNEL_HOSTS_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _request_host() -> str:
    return (request.host or "").split(":", 1)[0].lower()


def _serve_spa(app_name: str, subpath: str = ""):
    folder = PUBLIC_ROOT / app_name
    if not folder.exists():
        return f"Chua build frontend {app_name}. Chay build-public.bat truoc.", 503

    safe_path = (subpath or "").lstrip("/")
    if safe_path:
        candidate = folder / safe_path
        if candidate.is_file():
            return send_from_directory(folder, safe_path)
    return send_from_directory(folder, "index.html")


def _register_spa_routes(app, slug: str, folder_name: str):
    def serve(subpath=""):
        return _serve_spa(folder_name, subpath)

    serve.__name__ = f"serve_public_{slug}"
    app.add_url_rule(f"/{slug}/", f"public_{slug}_root", serve, methods=["GET"])
    app.add_url_rule(f"/{slug}/<path:subpath>", f"public_{slug}_path", serve, methods=["GET"])


def register_public_routes(app):
    paths = _load_public_paths()

    @app.get("/")
    def public_landing():
        hosts = _load_tunnel_hosts()
        host = _request_host()
        if host and host == (hosts.get("mentee") or "").lower():
            return redirect(f"/{paths['mentee']}/")
        if host and host == (hosts.get("mentor") or "").lower():
            return redirect(f"/{paths['mentor']}/login")
        if host and host == (hosts.get("superadmin") or "").lower():
            return redirect(f"/{paths['superadmin']}/login")
        return send_from_directory(LANDING_ROOT, "index.html")

    for role, folder in APP_FOLDERS.items():
        slug = paths.get(role, DEFAULT_PUBLIC_PATHS[role])
        _register_spa_routes(app, slug, folder)
