FROM python:3.12-slim AS base

RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chown -R appuser:appuser /app

RUN python -c "from image_analysis import load_model; load_model()" || echo "Model will load on first request"

USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
