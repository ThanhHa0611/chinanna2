#!/usr/bin/env bash
# Chạy backend + frontend cùng lúc
# Windows: dùng Git Bash → bash start.sh
# Mac/Linux: ./start.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PID=""
FRONTEND_PID=""
STOPPED=0

cleanup() {
  if [[ "$STOPPED" -eq 1 ]]; then
    return
  fi
  STOPPED=1

  echo ""
  echo "Đang dừng server..."
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if command -v pkill &>/dev/null; then
    pkill -P "$BACKEND_PID" 2>/dev/null || true
    pkill -P "$FRONTEND_PID" 2>/dev/null || true
  fi
  echo "Đã dừng."
}

trap cleanup SIGINT SIGTERM EXIT

echo "========================================"
echo "  Phong Van - Khởi động hệ thống"
echo "========================================"

# --- Backend setup ---
if [[ -f "$BACKEND_DIR/venv/Scripts/python.exe" ]]; then
  PYTHON="$BACKEND_DIR/venv/Scripts/python.exe"
  PIP="$BACKEND_DIR/venv/Scripts/pip.exe"
elif [[ -f "$BACKEND_DIR/venv/bin/python" ]]; then
  PYTHON="$BACKEND_DIR/venv/bin/python"
  PIP="$BACKEND_DIR/venv/bin/pip"
else
  echo "[Backend] Tạo virtual environment..."
  cd "$BACKEND_DIR"
  if command -v python3 &>/dev/null; then
    python3 -m venv venv
  else
    python -m venv venv
  fi
  if [[ -f "$BACKEND_DIR/venv/Scripts/python.exe" ]]; then
    PYTHON="$BACKEND_DIR/venv/Scripts/python.exe"
    PIP="$BACKEND_DIR/venv/Scripts/pip.exe"
  else
    PYTHON="$BACKEND_DIR/venv/bin/python"
    PIP="$BACKEND_DIR/venv/bin/pip"
  fi
fi

echo "[Backend] Cài dependencies (nếu cần)..."
"$PIP" install -r "$BACKEND_DIR/requirements.txt" -q

echo "[Backend] Đang chạy tại http://127.0.0.1:8000"
cd "$BACKEND_DIR"
"$PYTHON" app.py &
BACKEND_PID=$!

# --- Frontend setup ---
if ! command -v npm &>/dev/null; then
  echo "[Lỗi] Chưa cài Node.js/npm. Tải tại: https://nodejs.org/"
  exit 1
fi

cd "$FRONTEND_DIR"
if [[ ! -d node_modules ]]; then
  echo "[Frontend] Cài dependencies..."
  npm install
fi

echo "[Frontend] Đang chạy tại http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Backend:  http://127.0.0.1:8000"
echo "  Frontend: http://localhost:5173"
echo "  Nhấn Ctrl+C để dừng cả hai"
echo "========================================"
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || wait
