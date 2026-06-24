"""
LikasLens Real Evaluation Script
Runs actual model validation and produces real metrics for the AI Ethics Report.

Outputs:
  - _eval_results.json  (machine-readable metrics)
  - _eval_summary.txt   (human-readable summary for the report)
"""
import json
import os
import sys
import time
from pathlib import Path

BASE = Path(__file__).parent.resolve()
OUTPUT_FILE = BASE / "_eval_results.json"
SUMMARY_FILE = BASE / "_eval_summary.txt"

results = {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "models": {}}

def log(msg):
    print(msg, flush=True)
    with open(SUMMARY_FILE, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Clear previous summary
SUMMARY_FILE.write_text("", encoding="utf-8")

log("=" * 60)
log("LIKASLENS REAL EVALUATION PIPELINE")
log("=" * 60)

# ---------------------------------------------------------------------------
# Step 1: Validate YOLOv8n on COCO8 (auto-downloads 8 images)
# This gives us a REAL measured baseline on a small but real dataset.
# ---------------------------------------------------------------------------
log("\n[STEP 1] Validating YOLOv8n on COCO8 (auto-download small subset)...")
try:
    from ultralytics import YOLO

    coco_model = YOLO(str(BASE / "yolov8n.pt"))
    # coco8.yaml ships with ultralytics - 8 images, downloads automatically
    coco_val = coco_model.val(data="coco8.yaml", imgsz=640, verbose=True, save_json=True)

    coco_metrics = {
        "dataset": "COCO8 (8 images, auto-downloaded)",
        "mAP50": round(float(coco_val.box.map50), 4),
        "mAP50_95": round(float(coco_val.box.map), 4),
        "precision": round(float(coco_val.box.mp), 4),
        "recall": round(float(coco_val.box.mr), 4),
        "per_class": {},
    }

    # Per-class breakdown for environmental-relevant classes
    env_classes = [39, 40, 41, 44, 45, 46, 47, 48, 49, 52, 53, 54, 55, 58, 61]
    names = coco_model.names
    for cls_id in env_classes:
        if cls_id < len(coco_val.box.maps):
            coco_metrics["per_class"][str(cls_id)] = {
                "name": names.get(cls_id, f"class_{cls_id}"),
                "ap50": round(float(coco_val.box.maps[cls_id]), 4),
            }

    results["models"]["yolov8n_coco8"] = coco_metrics
    log(f"  mAP@0.5: {coco_metrics['mAP50']}")
    log(f"  mAP@0.5:0.95: {coco_metrics['mAP50_95']}")
    log(f"  Precision: {coco_metrics['precision']}")
    log(f"  Recall: {coco_metrics['recall']}")

except Exception as e:
    log(f"  COCO8 validation FAILED: {e}")
    results["models"]["yolov8n_coco8"] = {"error": str(e)}

# ---------------------------------------------------------------------------
# Step 2: Run waste model inference on COCO8 images
# The waste model has 8 classes: cardboard, e-waste, glass, medical, metal,
# organic, paper, plastic. We run it on the same COCO8 images and record
# what it detects. This gives us real detection counts and confidence stats.
# ---------------------------------------------------------------------------
log("\n[STEP 2] Running waste model on COCO8 images for detection stats...")
try:
    waste_model = YOLO(str(BASE / "models" / "yolov8-waste.pt"))
    waste_classes = waste_model.names
    log(f"  Waste model classes: {waste_classes}")

    # Find COCO8 images (ultralytics downloads to datasets/coco8/)
    coco8_path = BASE / "datasets" / "coco8" / "images" / "val"
    if not coco8_path.exists():
        # Try alternate locations
        for p in [
            BASE / "datasets" / "coco8" / "images",
            Path.home() / "datasets" / "coco8" / "images" / "val",
            Path.cwd() / "datasets" / "coco8" / "images" / "val",
        ]:
            if p.exists():
                coco8_path = p
                break

    if coco8_path.exists() and any(coco8_path.iterdir()):
        images = list(coco8_path.glob("*.jpg")) + list(coco8_path.glob("*.png"))
        log(f"  Found {len(images)} images in {coco8_path}")

        all_detections = []
        per_class_counts = {i: 0 for i in range(len(waste_classes))}
        confidence_scores = []
        latencies = []

        for img_path in images:
            t0 = time.perf_counter()
            preds = waste_model(str(img_path), conf=0.25, verbose=False)
            latency = (time.perf_counter() - t0) * 1000
            latencies.append(latency)

            for pred in preds:
                if pred.boxes is not None and len(pred.boxes) > 0:
                    for box, conf, cls in zip(pred.boxes.xyxy, pred.boxes.conf, pred.boxes.cls):
                        cls_id = int(cls.item())
                        conf_val = float(conf.item())
                        all_detections.append({
                            "image": img_path.name,
                            "class_id": cls_id,
                            "class_name": waste_classes.get(cls_id, f"class_{cls_id}"),
                            "confidence": round(conf_val, 4),
                            "bbox": [round(float(v), 1) for v in box.tolist()],
                        })
                        per_class_counts[cls_id] = per_class_counts.get(cls_id, 0) + 1
                        confidence_scores.append(conf_val)

        waste_stats = {
            "model": "yolov8-waste.pt",
            "classes": waste_classes,
            "total_images": len(images),
            "total_detections": len(all_detections),
            "per_class_counts": {
                waste_classes.get(k, f"class_{k}"): v
                for k, v in per_class_counts.items()
                if v > 0
            },
            "avg_confidence": round(sum(confidence_scores) / max(1, len(confidence_scores)), 4),
            "max_confidence": round(max(confidence_scores), 4) if confidence_scores else 0,
            "min_confidence": round(min(confidence_scores), 4) if confidence_scores else 0,
            "latency_ms": {
                "mean": round(sum(latencies) / max(1, len(latencies)), 2),
                "min": round(min(latencies), 2) if latencies else 0,
                "max": round(max(latencies), 2) if latencies else 0,
            },
            "sample_detections": all_detections[:20],
        }

        results["models"]["yolov8_waste_coco8"] = waste_stats
        log(f"  Total detections: {waste_stats['total_detections']}")
        log(f"  Per-class: {waste_stats['per_class_counts']}")
        log(f"  Avg confidence: {waste_stats['avg_confidence']}")
        log(f"  Avg latency: {waste_stats['latency_ms']['mean']}ms")

    else:
        log(f"  COCO8 path not found: {coco8_path}")
        results["models"]["yolov8_waste_coco8"] = {"error": "COCO8 images not found"}

except Exception as e:
    log(f"  Waste model inference FAILED: {e}")
    import traceback
    traceback.print_exc()
    results["models"]["yolov8_waste_coco8"] = {"error": str(e)}

# ---------------------------------------------------------------------------
# Step 3: Run COCO model on the same images for comparison
# ---------------------------------------------------------------------------
log("\n[STEP 3] Running COCO model on COCO8 images for comparison...")
try:
    coco8_path = BASE / "datasets" / "coco8" / "images" / "val"
    if not coco8_path.exists():
        for p in [
            BASE / "datasets" / "coco8" / "images",
            Path.home() / "datasets" / "coco8" / "images" / "val",
            Path.cwd() / "datasets" / "coco8" / "images" / "val",
        ]:
            if p.exists():
                coco8_path = p
                break

    if coco8_path.exists() and any(coco8_path.iterdir()):
        images = list(coco8_path.glob("*.jpg")) + list(coco8_path.glob("*.png"))
        coco_detections = []
        coco_latencies = []
        coco_confidences = []

        for img_path in images:
            t0 = time.perf_counter()
            preds = coco_model(str(img_path), conf=0.25, verbose=False)
            latency = (time.perf_counter() - t0) * 1000
            coco_latencies.append(latency)

            for pred in preds:
                if pred.boxes is not None and len(pred.boxes) > 0:
                    for box, conf, cls in zip(pred.boxes.xyxy, pred.boxes.conf, pred.boxes.cls):
                        cls_id = int(cls.item())
                        conf_val = float(conf.item())
                        coco_detections.append({
                            "class_id": cls_id,
                            "class_name": coco_model.names.get(cls_id, f"class_{cls_id}"),
                            "confidence": round(conf_val, 4),
                        })
                        coco_confidences.append(conf_val)

        coco_stats = {
            "total_images": len(images),
            "total_detections": len(coco_detections),
            "avg_confidence": round(sum(coco_confidences) / max(1, len(coco_confidences)), 4),
            "latency_ms_mean": round(sum(coco_latencies) / max(1, len(coco_latencies)), 2),
            "latency_ms_p50": round(sorted(coco_latencies)[len(coco_latencies) // 2], 2) if coco_latencies else 0,
        }
        results["models"]["yolov8n_coco8_inference"] = coco_stats
        log(f"  Total COCO detections: {coco_stats['total_detections']}")
        log(f"  Avg confidence: {coco_stats['avg_confidence']}")
        log(f"  Avg latency: {coco_stats['latency_ms_mean']}ms")

except Exception as e:
    log(f"  COCO inference FAILED: {e}")
    results["models"]["yolov8n_coco8_inference"] = {"error": str(e)}

# ---------------------------------------------------------------------------
# Step 4: Run full COCO val (if time permits - 5000 images)
# ---------------------------------------------------------------------------
log("\n[STEP 4] Attempting full COCO validation (coco128 - 128 images)...")
try:
    coco128_val = coco_model.val(data="coco128.yaml", imgsz=640, verbose=False)
    coco128_metrics = {
        "dataset": "COCO128 (128 images, auto-downloaded)",
        "mAP50": round(float(coco128_val.box.map50), 4),
        "mAP50_95": round(float(coco128_val.box.map), 4),
        "precision": round(float(coco128_val.box.mp), 4),
        "recall": round(float(coco128_val.box.mr), 4),
    }
    results["models"]["yolov8n_coco128"] = coco128_metrics
    log(f"  mAP@0.5: {coco128_metrics['mAP50']}")
    log(f"  Precision: {coco128_metrics['precision']}")
    log(f"  Recall: {coco128_metrics['recall']}")
except Exception as e:
    log(f"  COCO128 validation skipped: {e}")
    results["models"]["yolov8n_coco128"] = {"error": str(e)}

# ---------------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------------
log("\n" + "=" * 60)
log("SAVING RESULTS...")
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, default=str)
log(f"Results saved to: {OUTPUT_FILE}")
log(f"Summary saved to: {SUMMARY_FILE}")
log("=" * 60)
