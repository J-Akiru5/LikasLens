"""Final comprehensive eval - gets per-class COCO128 metrics for the report."""
import json
import time
from pathlib import Path
from collections import defaultdict

BASE = Path(__file__).parent.resolve()
OUTPUT = BASE / "_final_eval_results.json"

def log(msg):
    print(msg, flush=True)

from ultralytics import YOLO

results = {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}

# ---------------------------------------------------------------------------
# 1. COCO model official validation on COCO128 with per-class output
# ---------------------------------------------------------------------------
log("Running COCO128 validation with per-class output...")
coco_model = YOLO(str(BASE / "yolov8n.pt"))
val_results = coco_model.val(data="coco128.yaml", imgsz=640, verbose=True)

# Extract per-class metrics
per_class = {}
names = coco_model.names
for cls_id in range(len(val_results.box.maps)):
    ap50 = float(val_results.box.maps[cls_id]) if cls_id < len(val_results.box.maps) else 0.0
    # Per-class precision/recall
    per_class[str(cls_id)] = {
        "name": names.get(cls_id, f"class_{cls_id}"),
        "ap50": round(ap50, 4),
    }

coco128_results = {
    "dataset": "COCO128 (128 images, 929 instances, CC BY 4.0)",
    "mAP50": round(float(val_results.box.map50), 4),
    "mAP50_95": round(float(val_results.box.map), 4),
    "precision": round(float(val_results.box.mp), 4),
    "recall": round(float(val_results.box.mr), 4),
    "speed": {
        "preprocess_ms": round(float(val_results.speed.get("preprocess", 0)), 2),
        "inference_ms": round(float(val_results.speed.get("inference", 0)), 2),
        "postprocess_ms": round(float(val_results.speed.get("postprocess", 0)), 2),
    },
    "per_class_ap50": per_class,
    "total_images": 128,
    "total_instances": 929,
}

results["coco128_official_val"] = coco128_results

log(f"  mAP@0.5: {coco128_results['mAP50']}")
log(f"  mAP@0.5:0.95: {coco128_results['mAP50_95']}")
log(f"  Precision: {coco128_results['precision']}")
log(f"  Recall: {coco128_results['recall']}")
log(f"  Inference speed: {coco128_results['speed']['inference_ms']}ms/image")

# Print environmental-relevant per-class
log("\n  Environmental-relevant per-class AP@0.5:")
env_classes = [39, 40, 41, 44, 45, 46, 47, 48, 49, 52, 53, 54, 55, 58, 61, 73, 75, 76]
for cls_id in env_classes:
    if str(cls_id) in per_class:
        info = per_class[str(cls_id)]
        if info["ap50"] > 0:
            log(f"    {info['name']:15s} AP@0.5={info['ap50']:.4f}")

# ---------------------------------------------------------------------------
# 2. Waste model latency benchmark (on 128 images)
# ---------------------------------------------------------------------------
log("\nBenchmarking waste model latency on 128 images...")
waste_model = YOLO(str(BASE / "models" / "yolov8-waste.pt"))
waste_names = waste_model.names

coco128_img_dir = BASE / "datasets" / "coco128" / "images" / "train2017"
images = sorted(list(coco128_img_dir.glob("*.jpg")))

waste_latencies = []
waste_detection_count = 0
waste_confidences = []
waste_class_counts = defaultdict(int)

for img_path in images:
    t0 = time.perf_counter()
    preds = waste_model(str(img_path), conf=0.25, verbose=False)
    latency = (time.perf_counter() - t0) * 1000
    waste_latencies.append(latency)

    for pred in preds:
        if pred.boxes is not None and len(pred.boxes) > 0:
            for box, conf, cls in zip(pred.boxes.xyxy, pred.boxes.conf, pred.boxes.cls):
                cls_id = int(cls.item())
                waste_detection_count += 1
                waste_confidences.append(float(conf.item()))
                waste_class_counts[waste_names[cls_id]] += 1

waste_latencies.sort()
waste_latency_stats = {
    "mean_ms": round(sum(waste_latencies) / len(waste_latencies), 2),
    "p50_ms": round(waste_latencies[len(waste_latencies) // 2], 2),
    "p95_ms": round(waste_latencies[int(len(waste_latencies) * 0.95)], 2),
    "min_ms": round(waste_latencies[0], 2),
    "max_ms": round(waste_latencies[-1], 2),
}

waste_benchmark = {
    "model": "yolov8-waste.pt",
    "classes": waste_names,
    "total_images": len(images),
    "total_detections": waste_detection_count,
    "detection_class_distribution": dict(waste_class_counts),
    "avg_confidence": round(sum(waste_confidences) / max(1, len(waste_confidences)), 4),
    "latency": waste_latency_stats,
}
results["waste_model_benchmark"] = waste_benchmark

log(f"  Total detections on 128 images: {waste_detection_count}")
log(f"  Class distribution: {dict(waste_class_counts)}")
log(f"  Avg confidence: {waste_benchmark['avg_confidence']}")
log(f"  Latency p50: {waste_latency_stats['p50_ms']}ms, p95: {waste_latency_stats['p95_ms']}ms")

# ---------------------------------------------------------------------------
# 3. COCO model latency benchmark
# ---------------------------------------------------------------------------
log("\nBenchmarking COCO model latency on 128 images...")
coco_latencies = []
coco_detection_count = 0

for img_path in images:
    t0 = time.perf_counter()
    preds = coco_model(str(img_path), conf=0.25, verbose=False)
    latency = (time.perf_counter() - t0) * 1000
    coco_latencies.append(latency)
    for pred in preds:
        if pred.boxes is not None:
            coco_detection_count += len(pred.boxes)

coco_latencies.sort()
coco_latency_stats = {
    "mean_ms": round(sum(coco_latencies) / len(coco_latencies), 2),
    "p50_ms": round(coco_latencies[len(coco_latencies) // 2], 2),
    "p95_ms": round(coco_latencies[int(len(coco_latencies) * 0.95)], 2),
}

results["coco_model_benchmark"] = {
    "model": "yolov8n.pt",
    "total_images": len(images),
    "total_detections": coco_detection_count,
    "latency": coco_latency_stats,
}
log(f"  Total detections: {coco_detection_count}")
log(f"  Latency p50: {coco_latency_stats['p50_ms']}ms, p95: {coco_latency_stats['p95_ms']}ms")

# ---------------------------------------------------------------------------
# 4. Composite scoring simulation
# ---------------------------------------------------------------------------
log("\nSimulating composite scoring on 128 images...")
from image_analysis import compute_composite_score, triage_disposition

composite_scores = []
triage_counts = {"auto_routed": 0, "pending_review": 0, "auto_dismissed": 0}

for img_path in images:
    coco_preds = coco_model(str(img_path), conf=0.25, verbose=False)
    waste_preds = waste_model(str(img_path), conf=0.25, verbose=False)

    coco_max = 0.0
    for pred in coco_preds:
        if pred.boxes is not None and len(pred.boxes.conf) > 0:
            coco_max = max(coco_max, float(max(pred.boxes.conf)))

    waste_max = 0.0
    has_agreement = False
    for pred in waste_preds:
        if pred.boxes is not None and len(pred.boxes.conf) > 0:
            waste_max = max(waste_max, float(max(pred.boxes.conf)))
            if waste_max > 0.25:
                has_agreement = True

    composite = compute_composite_score(coco_max, waste_max, has_agreement, 0.0)
    disposition = triage_disposition(composite)
    composite_scores.append(composite)
    triage_counts[disposition] += 1

results["composite_scoring"] = {
    "total_images": len(images),
    "avg_composite": round(sum(composite_scores) / len(composite_scores), 4),
    "max_composite": round(max(composite_scores), 4),
    "triage_distribution": triage_counts,
    "triage_percentages": {
        k: round(v / len(images) * 100, 2) for k, v in triage_counts.items()
    },
}
log(f"  Avg composite score: {results['composite_scoring']['avg_composite']}")
log(f"  Triage: {triage_counts}")
log(f"  Percentages: {results['composite_scoring']['triage_percentages']}")

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, default=str)

log(f"\n{'='*60}")
log(f"ALL RESULTS SAVED TO: {OUTPUT}")
log(f"{'='*60}")
log(f"\nSUMMARY FOR REPORT:")
log(f"  Dataset: COCO128 (128 images, 929 instances, CC BY 4.0)")
log(f"  COCO mAP@0.5:      {coco128_results['mAP50']}")
log(f"  COCO Precision:    {coco128_results['precision']}")
log(f"  COCO Recall:       {coco128_results['recall']}")
log(f"  COCO latency p50:  {coco_latency_stats['p50_ms']}ms")
log(f"  Waste detections:  {waste_detection_count} on 128 images")
log(f"  Waste latency p50: {waste_latency_stats['p50_ms']}ms")
log(f"  Composite triage:  {triage_counts}")
