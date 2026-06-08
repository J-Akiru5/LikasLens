FROM python:3.12-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Preload COCO model at build time (cached in /root/.cache/ultralytics)
RUN python -c "from image_analysis import load_coco_model; load_coco_model(); print('COCO model preloaded')" 2>&1

# Download environmental model at build time if ENV_MODEL_PATH is set
ARG ENV_MODEL_REPO=HrutikAdsare/waste-detection-yolov8
RUN python -c " \
    import os; \
    from huggingface_hub import hf_hub_download; \
    model_path = os.getenv('ENV_MODEL_PATH', 'models/yolov8-waste.pt'); \
    os.makedirs(os.path.dirname(model_path) or '.', exist_ok=True); \
    hf_hub_download(repo_id=os.getenv('ENV_MODEL_REPO', '$ENV_MODEL_REPO'), filename='best.pt', local_dir=os.path.dirname(model_path) or '.'); \
    print(f'Environmental model downloaded to {model_path}'); \
    " 2>&1 || echo "Environmental model download skipped (set ENV_MODEL_PATH and ENV_MODEL_REPO)"

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
