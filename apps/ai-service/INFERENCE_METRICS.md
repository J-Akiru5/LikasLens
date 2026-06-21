# YOLOv8 Nano Inference Metrics — Submission Reference

This file documents how `apps/ai-service/image_analysis.py` records inference
metrics for the submission report. The actual collection is opt-in via the
`LIKASLENS_METRICS_LOG` env var.

## Enabling

```bash
export LIKASLENS_METRICS_LOG=/var/log/likaslens/inference.jsonl
```

Every call to `analyze_image()` / `analyze_base64()` will append one JSONL
line: `{ts, image_id, latency_ms, model, detection_count, has_environmental_concern, classes}`.

## Running the eval harness

Once ≥ 200 inferences are collected, run:

```bash
python apps/ai-service/eval_metrics.py \
  --log /var/log/likaslens/inference.jsonl \
  --ground-truth apps/ai-service/test_data/ground_truth.jsonl \
  --output apps/ai-service/metrics_report.json
```

The harness computes per-class mAP@0.5, precision, recall, and p50/p95
latency stats. The submission report's KPI scorecard (Section 5) cites the
resulting `summary` block.

## Why opt-in

`analyze_image()` is on the hot path. The instrumentation writes are guarded
behind the env var so production deployments that don't want filesystem I/O
pay no cost. When the env var is unset, behaviour is identical to the prior
version.
