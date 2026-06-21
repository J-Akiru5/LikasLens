#!/usr/bin/env bash
set -e

echo "=========================================="
echo " LikasLens AI Service — Startup"
echo "=========================================="

# --- Roboflow connectivity check ---
echo ""
echo "[startup] Checking Roboflow integration..."
python -c "
from roboflow_client import is_configured, health_check
import sys

if not is_configured():
    print('[startup] Roboflow: DISABLED (ROBOFLOW_API_KEY or ROBOFLOW_MODEL_ID not set)')
    print('[startup] Detection will use COCO + env model only.')
    sys.exit(0)

result = health_check()
if result.get('roboflow_connected'):
    print(f'[startup] Roboflow: OK — model={result[\"model\"]}')
else:
    print(f'[startup] Roboflow: WARNING — {result.get(\"error\", \"unknown error\")}')
    print('[startup] Detection will fall back to COCO + env model.')
" || echo "[startup] Roboflow health check skipped (non-critical)"

# --- YOLO model preload (best-effort) ---
echo ""
echo "[startup] Preloading YOLO models..."
python -c "
from image_analysis import load_coco_model, load_env_model
load_coco_model()
load_env_model()
print('[startup] YOLO models loaded successfully.')
" || echo "[startup] YOLO preload failed — will load on first request"

echo ""
echo "=========================================="
echo " Starting uvicorn on port 8001"
echo "=========================================="
echo ""

exec uvicorn main:app --host 0.0.0.0 --port 8001
