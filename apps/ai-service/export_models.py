"""
Export YOLO models to ONNX format for browser-based inference.

Usage:
    python export_models.py

Exports:
    1. yolov8s.pt (COCO) → yolov8s-coco.onnx (~22MB)
    2. yolov8-waste.pt (ENV) → yolov8s-waste.onnx (~22MB)

The exported ONNX models are placed in:
    apps/frontend/public/models/
    apps/mobile-pwa/public/models/

Both apps share the same models for consistent offline inference.
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

# Resolve paths relative to this script
SCRIPT_DIR = Path(__file__).parent
REPO_ROOT = SCRIPT_DIR.parent.parent
FRONTEND_MODELS = REPO_ROOT / "apps" / "frontend" / "public" / "models"
MOBILE_MODELS = REPO_ROOT / "apps" / "mobile-pwa" / "public" / "models"


def download_yolov8s_coco() -> Path:
    """Download YOLOv8s COCO model if not present."""
    model_path = SCRIPT_DIR / "yolov8s.pt"
    if model_path.exists():
        print(f"  [skip] YOLOv8s COCO model already exists: {model_path}")
        return model_path

    print("  Downloading YOLOv8s (COCO) model...")
    from ultralytics import YOLO
    model = YOLO("yolov8s.pt")  # auto-downloads
    # The model is saved in the current working directory by ultralytics
    cwd_model = Path.cwd() / "yolov8s.pt"
    if cwd_model.exists() and cwd_model != model_path:
        shutil.move(str(cwd_model), str(model_path))
    elif not model_path.exists():
        # ultralytics may save in CWD, find it
        print(f"  Model downloaded. Check {Path.cwd()} for yolov8s.pt")
    return model_path


def export_to_onnx(pt_path: Path, onnx_name: str, imgsz: int = 640) -> Path:
    """Export a .pt model to ONNX format."""
    from ultralytics import YOLO

    print(f"\n  Exporting {pt_path.name} → {onnx_name}...")
    model = YOLO(str(pt_path))

    onnx_path = model.export(
        format="onnx",
        imgsz=imgsz,
        simplify=True,
        opset=12,  # ONNX opset 12 for broad browser compatibility
        half=False,  # FP32 for maximum browser compatibility
        dynamic=False,  # static shape for better optimization
    )

    # ultralytics returns the path as a string
    onnx_path = Path(onnx_path)
    print(f"  Exported: {onnx_path} ({onnx_path.stat().st_size / 1024 / 1024:.1f} MB)")
    return onnx_path


def copy_to_apps(onnx_source: Path, onnx_name: str) -> None:
    """Copy ONNX model to both frontend and mobile-pwa public/models/ dirs."""
    for dest_dir in [FRONTEND_MODELS, MOBILE_MODELS]:
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / onnx_name
        shutil.copy2(str(onnx_source), str(dest))
        print(f"  Copied → {dest}")


def generate_class_labels() -> None:
    """Generate class label JSON files for browser-side decoding."""
    import json

    # COCO 80 classes (YOLOv8 standard)
    coco_classes = [
        "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
        "truck", "boat", "traffic light", "fire hydrant", "stop sign",
        "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep",
        "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
        "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
        "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
        "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
        "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
        "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
        "couch", "potted plant", "bed", "dining table", "toilet", "tv",
        "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
        "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
        "scissors", "teddy bear", "hair drier", "toothbrush",
    ]

    # Waste classes (TACO / common waste detection models)
    waste_classes = [
        "Aluminium foil", "Battery", "Aluminium blister pack", "Carded blister pack",
        "Other plastic bottle", "Clear plastic bottle", "Glass bottle",
        "Plastic bottle cap", "Metal bottle cap", "Broken glass",
        "Food Can", "Aerosol", "Clear plastic cup", "Other plastic cup",
        "Paper cup", "Disposable plastic cup", "Foam cup", "Glass cup",
        "Other plastic container", "Meal carton", "Pizza box", "Paper cup",
        "Meal lid", "Other plastic", "Plastic film", "Garbage bag",
        "Single-use carrier bag", "Polypropylene bag", "Paper bag",
        "Drink can", "Food can", "Metal lid", "Aluminium foil", "Metal",
        "Cigarette", "Paper", "Magazine", "Tissues", "Wrapping paper",
        "Normal paper", "Paper straw", "Plastic straw", "Styrofoam piece",
        "Rope", "Shoe", "Scrap metal", "Tire", "Battery", "Egg carton",
        "Foam food container", "Foam piece", "Cardboard", "Paper",
        "Plastic", "Glass", "Metal", "Organic waste", "Other",
    ]

    # COCO environmental-relevant subset (things we care about for LikasLens)
    coco_env_subset = [
        "bottle", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
        "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
        "cake", "chair", "couch", "potted plant", "bed", "dining table",
        "toilet", "tv", "laptop", "cell phone", "book", "clock", "vase",
        "scissors", "teddy bear", "backpack", "umbrella", "handbag", "suitcase",
        "frisbee", "sports ball", "skateboard", "surfboard", "bicycle",
        "motorcycle", "car", "bus", "truck", "boat", "traffic light",
        "fire hydrant", "stop sign", "bench", "bird", "cat", "dog",
    ]

    for dest_dir in [FRONTEND_MODELS, MOBILE_MODELS]:
        dest_dir.mkdir(parents=True, exist_ok=True)

        # COCO classes
        coco_path = dest_dir / "coco-classes.json"
        with open(coco_path, "w") as f:
            json.dump(coco_classes, f, indent=2)
        print(f"  Generated → {coco_path}")

        # Waste classes
        waste_path = dest_dir / "waste-classes.json"
        with open(waste_path, "w") as f:
            json.dump(waste_classes, f, indent=2)
        print(f"  Generated → {waste_path}")

        # Model metadata
        meta = {
            "version": "1.0.0",
            "models": {
                "coco": {
                    "file": "yolov8s-coco.onnx",
                    "classes": "coco-classes.json",
                    "input_size": 640,
                    "description": "YOLOv8s COCO - General object detection (80 classes)",
                },
                "waste": {
                    "file": "yolov8s-waste.onnx",
                    "classes": "waste-classes.json",
                    "input_size": 640,
                    "description": "YOLOv8s Waste - Environmental waste detection",
                },
            },
            "exported_at": "2026-06-22",
            "framework": "onnxruntime-web",
        }
        meta_path = dest_dir / "model-meta.json"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)
        print(f"  Generated → {meta_path}")


def main() -> None:
    print("=" * 60)
    print("LikasLens — YOLO Model Export to ONNX")
    print("=" * 60)

    # Ensure ultralytics is available
    try:
        import ultralytics  # noqa: F401
        print(f"\n  ultralytics version: {ultralytics.__version__}")
    except ImportError:
        print("\n  ERROR: ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    # Step 1: Ensure YOLOv8s COCO model exists
    print("\n[1/4] Preparing YOLOv8s COCO model...")
    coco_pt = SCRIPT_DIR / "yolov8s.pt"
    if not coco_pt.exists():
        # Download by loading it (ultralytics caches in working dir)
        from ultralytics import YOLO
        YOLO("yolov8s.pt")
        # Move to ai-service dir if found in cwd
        cwd_model = Path.cwd() / "yolov8s.pt"
        if cwd_model.exists():
            shutil.move(str(cwd_model), str(coco_pt))

    if not coco_pt.exists():
        print("  ERROR: Could not find yolov8s.pt. Download manually from:")
        print("  https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8s.pt")
        sys.exit(1)
    print(f"  Found: {coco_pt} ({coco_pt.stat().st_size / 1024 / 1024:.1f} MB)")

    # Step 2: Ensure waste model exists
    print("\n[2/4] Preparing waste detection model...")
    waste_pt = SCRIPT_DIR / "models" / "yolov8-waste.pt"
    if not waste_pt.exists():
        waste_pt = SCRIPT_DIR / "models" / "best.pt"
    if not waste_pt.exists():
        print("  ERROR: No waste model found. Expected at models/yolov8-waste.pt or models/best.pt")
        sys.exit(1)
    print(f"  Found: {waste_pt} ({waste_pt.stat().st_size / 1024 / 1024:.1f} MB)")

    # Step 3: Export to ONNX
    print("\n[3/4] Exporting models to ONNX...")
    coco_onnx = export_to_onnx(coco_pt, "yolov8s-coco.onnx")
    waste_onnx = export_to_onnx(waste_pt, "yolov8s-waste.onnx")

    # Step 4: Copy to app public directories
    print("\n[4/4] Copying ONNX models to app public directories...")
    copy_to_apps(coco_onnx, "yolov8s-coco.onnx")
    copy_to_apps(waste_onnx, "yolov8s-waste.onnx")

    # Generate class labels
    print("\n  Generating class label files...")
    generate_class_labels()

    print("\n" + "=" * 60)
    print("Export complete!")
    print(f"  Models in: {FRONTEND_MODELS}")
    print(f"  Models in: {MOBILE_MODELS}")
    print("=" * 60)


if __name__ == "__main__":
    main()
