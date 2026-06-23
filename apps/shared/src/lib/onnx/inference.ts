/**
 * Browser-side ONNX inference engine for YOLOv8 models.
 *
 * Runs YOLOv8 object detection entirely in the browser using ONNX Runtime Web.
 * Supports both COCO general detection and waste-specific detection models.
 *
 * Architecture:
 *   Image → Canvas resize (640×640) → Float32 tensor → ONNX Runtime → Post-process → Detections
 *
 * @module onnx-inference
 */

// ---------------------------------------------------------------------------
// Types — mirrors the server-side detection format from image_analysis.py
// ---------------------------------------------------------------------------

export interface Detection {
  class_id: number;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in original image coords
  source: "onnx-coco" | "onnx-waste";
}

export interface InferenceResult {
  detections: Detection[];
  detection_count: number;
  latency_ms: number;
  model: string;
  has_environmental_concern: boolean;
  environmental_indicators: string[];
  composite_confidence: number;
  triage_disposition: "auto_routed" | "pending_review" | "auto_dismissed";
}

export interface ModelConfig {
  name: "coco" | "waste";
  modelFile: string;
  classesFile: string;
  inputSize: number;
  confidenceThreshold: number;
  nmsThreshold: number;
}

export type InferenceStatus = "idle" | "loading" | "ready" | "running" | "error";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL_BASE_PATH = "/models";

const COCO_CONFIG: ModelConfig = {
  name: "coco",
  modelFile: `${MODEL_BASE_PATH}/yolov8s-coco.onnx`,
  classesFile: `${MODEL_BASE_PATH}/coco-classes.json`,
  inputSize: 640,
  confidenceThreshold: 0.25,
  nmsThreshold: 0.45,
};

const WASTE_CONFIG: ModelConfig = {
  name: "waste",
  modelFile: `${MODEL_BASE_PATH}/yolov8s-waste.onnx`,
  classesFile: `${MODEL_BASE_PATH}/waste-classes.json`,
  inputSize: 640,
  confidenceThreshold: 0.25,
  nmsThreshold: 0.45,
};

// Environmental keywords from COCO classes relevant to LikasLens
const COCO_ENV_KEYWORDS = new Set([
  "bottle", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
  "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
  "cake", "chair", "couch", "potted plant", "bed", "dining table",
  "toilet", "tv", "laptop", "cell phone", "book", "clock", "vase",
  "scissors", "teddy bear", "backpack", "umbrella", "handbag", "suitcase",
  "frisbee", "sports ball", "skateboard", "surfboard", "bicycle",
  "motorcycle", "car", "bus", "truck", "boat", "traffic light",
  "fire hydrant", "stop sign", "bench", "bird", "cat", "dog",
]);

// Waste classes that are environmental concerns
const WASTE_ENV_KEYWORDS = new Set([
  "Aluminium foil", "Battery", "Broken glass", "Food Can", "Aerosol",
  "Plastic bottle", "Clear plastic bottle", "Glass bottle",
  "Plastic bottle cap", "Metal bottle cap", "Cigarette",
  "Garbage bag", "Single-use carrier bag", "Polypropylene bag",
  "Paper bag", "Styrofoam piece", "Rope", "Scrap metal", "Tire",
  "Foam piece", "Cardboard", "Plastic", "Glass", "Metal",
]);

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let _ortModule: typeof import("onnxruntime-web") | null = null;
let _cocoSession: import("onnxruntime-web").InferenceSession | null = null;
let _wasteSession: import("onnxruntime-web").InferenceSession | null = null;
let _cocoClasses: string[] = [];
let _wasteClasses: string[] = [];
let _status: InferenceStatus = "idle";
let _statusListeners: Array<(status: InferenceStatus) => void> = [];

// ---------------------------------------------------------------------------
// Status management
// ---------------------------------------------------------------------------

function setStatus(s: InferenceStatus) {
  _status = s;
  for (const listener of _statusListeners) listener(s);
}

export function getInferenceStatus(): InferenceStatus {
  return _status;
}

export function onInferenceStatusChange(
  listener: (status: InferenceStatus) => void
): () => void {
  _statusListeners.push(listener);
  return () => {
    _statusListeners = _statusListeners.filter((l) => l !== listener);
  };
}

// ---------------------------------------------------------------------------
// Model loading
// ---------------------------------------------------------------------------

async function loadOrt(): Promise<typeof import("onnxruntime-web")> {
  if (_ortModule) return _ortModule;
  // Dynamic import to avoid bundling ONNX Runtime when not needed.
  // If the optional dependency is missing, surface a clear error so callers
  // can degrade gracefully instead of crashing the build/runtime.
  let ort: typeof import("onnxruntime-web");
  try {
    ort = await import("onnxruntime-web");
  } catch (err) {
    throw new Error(
      "onnxruntime-web is not installed. It is an optional dependency — install it in the consuming app to enable on-device inference."
    );
  }
  // Use WASM backend for broad browser compatibility
  ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
  ort.env.wasm.simd = true;
  _ortModule = ort;
  return ort;
}

async function loadClasses(url: string): Promise<string[]> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load classes from ${url}: ${resp.status}`);
  return resp.json();
}

async function loadSession(
  ort: typeof import("onnxruntime-web"),
  modelUrl: string
): Promise<import("onnxruntime-web").InferenceSession> {
  const resp = await fetch(modelUrl);
  if (!resp.ok) {
    throw new Error(
      `Failed to load ONNX model from ${modelUrl}: ${resp.status}. ` +
      `Ensure the model file is in public/models/.`
    );
  }
  const buffer = await resp.arrayBuffer();
  return ort.InferenceSession.create(buffer, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

/**
 * Initialize ONNX models. Call once at app startup or lazily on first inference.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initializeOnnx(): Promise<void> {
  if (_status === "ready" || _status === "loading") return;
  setStatus("loading");

  try {
    const ort = await loadOrt();

    // Load class labels and sessions in parallel
    const [cocoClasses, wasteClasses, cocoSession, wasteSession] = await Promise.all([
      loadClasses(COCO_CONFIG.classesFile),
      loadClasses(WASTE_CONFIG.classesFile),
      loadSession(ort, COCO_CONFIG.modelFile),
      loadSession(ort, WASTE_CONFIG.modelFile),
    ]);

    _cocoClasses = cocoClasses;
    _wasteClasses = wasteClasses;
    _cocoSession = cocoSession;
    _wasteSession = wasteSession;

    setStatus("ready");
  } catch (err) {
    setStatus("error");
    throw err;
  }
}

/**
 * Check if ONNX models are available (cached in browser).
 */
export function isOnnxReady(): boolean {
  return _status === "ready";
}

// ---------------------------------------------------------------------------
// Image preprocessing
// ---------------------------------------------------------------------------

function preprocessImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | string,
  inputSize: number
): { tensor: Float32Array; origWidth: number; origHeight: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = inputSize;
  canvas.height = inputSize;

  let origWidth: number;
  let origHeight: number;

  if (typeof imageSource === "string") {
    // base64 data URL
    const img = new Image();
    img.src = imageSource;
    // Synchronous draw — image must be pre-loaded
    origWidth = img.naturalWidth || img.width;
    origHeight = img.naturalHeight || img.height;
  } else {
    origWidth = imageSource instanceof HTMLCanvasElement
      ? imageSource.width
      : imageSource.naturalWidth || imageSource.width;
    origHeight = imageSource instanceof HTMLCanvasElement
      ? imageSource.height
      : imageSource.naturalHeight || imageSource.height;
  }

  // Letterbox resize: maintain aspect ratio, pad with gray
  const scale = Math.min(inputSize / origWidth, inputSize / origHeight);
  const newW = Math.round(origWidth * scale);
  const newH = Math.round(origHeight * scale);
  const padX = (inputSize - newW) / 2;
  const padY = (inputSize - newH) / 2;

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, inputSize, inputSize);
  ctx.drawImage(
    typeof imageSource === "string" ? (() => { const i = new Image(); i.src = imageSource; return i; })() : imageSource,
    padX, padY, newW, newH
  );

  const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
  const pixels = imageData.data;

  // Convert to NCHW Float32 tensor, normalized to [0, 1]
  const tensor = new Float32Array(3 * inputSize * inputSize);
  const channelSize = inputSize * inputSize;

  for (let i = 0; i < channelSize; i++) {
    const pixelIndex = i * 4;
    tensor[i] = pixels[pixelIndex] / 255.0; // R
    tensor[channelSize + i] = pixels[pixelIndex + 1] / 255.0; // G
    tensor[2 * channelSize + i] = pixels[pixelIndex + 2] / 255.0; // B
  }

  return { tensor, origWidth, origHeight };
}

function preprocessFromDataUrl(
  dataUrl: string,
  inputSize: number
): Promise<{ tensor: Float32Array; origWidth: number; origHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = inputSize;
      canvas.height = inputSize;

      const origWidth = img.naturalWidth;
      const origHeight = img.naturalHeight;

      // Letterbox resize
      const scale = Math.min(inputSize / origWidth, inputSize / origHeight);
      const newW = Math.round(origWidth * scale);
      const newH = Math.round(origHeight * scale);
      const padX = (inputSize - newW) / 2;
      const padY = (inputSize - newH) / 2;

      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, inputSize, inputSize);
      ctx.drawImage(img, padX, padY, newW, newH);

      const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
      const pixels = imageData.data;

      const tensor = new Float32Array(3 * inputSize * inputSize);
      const channelSize = inputSize * inputSize;

      for (let i = 0; i < channelSize; i++) {
        const pixelIndex = i * 4;
        tensor[i] = pixels[pixelIndex] / 255.0;
        tensor[channelSize + i] = pixels[pixelIndex + 1] / 255.0;
        tensor[2 * channelSize + i] = pixels[pixelIndex + 2] / 255.0;
      }

      resolve({ tensor, origWidth, origHeight });
    };
    img.onerror = () => reject(new Error("Failed to load image for inference"));
    img.src = dataUrl;
  });
}

// ---------------------------------------------------------------------------
// Post-processing (NMS + bbox decoding)
// ---------------------------------------------------------------------------

function yoloPostProcess(
  output: Float32Array,
  classes: string[],
  config: ModelConfig,
  origWidth: number,
  origHeight: number,
  source: "onnx-coco" | "onnx-waste"
): Detection[] {
  const { inputSize, confidenceThreshold, nmsThreshold } = config;
  const numClasses = classes.length;
  // YOLOv8 output shape: [1, (4 + numClasses), 8400]
  const numDetections = 8400;

  const scale = Math.min(inputSize / origWidth, inputSize / origHeight);
  const padX = (inputSize - Math.round(origWidth * scale)) / 2;
  const padY = (inputSize - Math.round(origHeight * scale)) / 2;

  const boxes: Array<[number, number, number, number]> = [];
  const scores: number[] = [];
  const classIds: number[] = [];

  for (let i = 0; i < numDetections; i++) {
    // Extract class scores
    let maxScore = 0;
    let maxClassId = 0;
    for (let c = 0; c < numClasses; c++) {
      // YOLOv8 output: [1, 4+numClasses, 8400]
      // Access: output[(4 + c) * numDetections + i]
      const score = output[(4 + c) * numDetections + i];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    if (maxScore < confidenceThreshold) continue;

    // Extract bbox (center format: cx, cy, w, h)
    const cx = output[0 * numDetections + i];
    const cy = output[1 * numDetections + i];
    const w = output[2 * numDetections + i];
    const h = output[3 * numDetections + i];

    // Convert to corner format and undo letterbox
    let x1 = (cx - w / 2 - padX) / scale;
    let y1 = (cy - h / 2 - padY) / scale;
    let x2 = (cx + w / 2 - padX) / scale;
    let y2 = (cy + h / 2 - padY) / scale;

    // Clamp to original image bounds
    x1 = Math.max(0, Math.min(x1, origWidth));
    y1 = Math.max(0, Math.min(y1, origHeight));
    x2 = Math.max(0, Math.min(x2, origWidth));
    y2 = Math.max(0, Math.min(y2, origHeight));

    boxes.push([x1, y1, x2, y2]);
    scores.push(maxScore);
    classIds.push(maxClassId);
  }

  // Per-class NMS
  const keepIndices = nms(boxes, scores, classIds, nmsThreshold);

  return keepIndices.map((idx) => ({
    class_id: classIds[idx],
    label: classes[classIds[idx]] || `class_${classIds[idx]}`,
    confidence: Math.round(scores[idx] * 10000) / 10000,
    bbox: [
      Math.round(boxes[idx][0] * 10) / 10,
      Math.round(boxes[idx][1] * 10) / 10,
      Math.round(boxes[idx][2] * 10) / 10,
      Math.round(boxes[idx][3] * 10) / 10,
    ] as [number, number, number, number],
    source,
  }));
}

function nms(
  boxes: Array<[number, number, number, number]>,
  scores: number[],
  classIds: number[],
  threshold: number
): number[] {
  const indices = scores
    .map((_, i) => i)
    .sort((a, b) => scores[b] - scores[a]);

  const keep: number[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    if (suppressed.has(idx)) continue;
    keep.push(idx);

    for (let j = i + 1; j < indices.length; j++) {
      const otherIdx = indices[j];
      if (suppressed.has(otherIdx)) continue;
      if (classIds[idx] !== classIds[otherIdx]) continue;

      const iou = computeIoU(boxes[idx], boxes[otherIdx]);
      if (iou > threshold) suppressed.add(otherIdx);
    }
  }

  return keep;
}

function computeIoU(
  a: [number, number, number, number],
  b: [number, number, number, number]
): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0;
}

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

async function runModel(
  session: import("onnxruntime-web").InferenceSession,
  tensor: Float32Array,
  inputSize: number,
  classes: string[],
  config: ModelConfig,
  origWidth: number,
  origHeight: number,
  source: "onnx-coco" | "onnx-waste"
): Promise<Detection[]> {
  const ort = await loadOrt();

  const inputTensor = new ort.Tensor("float32", tensor, [1, 3, inputSize, inputSize]);
  const feeds: Record<string, import("onnxruntime-web").Tensor> = {};
  const inputNames = session.inputNames;
  feeds[inputNames[0]] = inputTensor;

  const results = await session.run(feeds);
  const outputNames = session.outputNames;
  const output = results[outputNames[0]].data as Float32Array;

  return yoloPostProcess(output, classes, config, origWidth, origHeight, source);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run on-device inference on an image.
 *
 * @param imageDataUrl - Base64 data URL of the image (from canvas.toDataURL)
 * @param options - Optional overrides for confidence/NMS thresholds
 * @returns Inference result with detections, environmental assessment, and triage
 */
export async function inferOnDevice(
  imageDataUrl: string,
  options?: {
    confidenceThreshold?: number;
    nmsThreshold?: number;
    runBoth?: boolean; // default: true — run both COCO and waste models
  }
): Promise<InferenceResult> {
  if (_status !== "ready") {
    await initializeOnnx();
  }

  setStatus("running");
  const startTime = performance.now();

  try {
    const inputSize = COCO_CONFIG.inputSize;
    const { tensor, origWidth, origHeight } = await preprocessFromDataUrl(imageDataUrl, inputSize);

    const runBoth = options?.runBoth !== false;

    // Override thresholds if provided
    const cocoConfig = { ...COCO_CONFIG };
    const wasteConfig = { ...WASTE_CONFIG };
    if (options?.confidenceThreshold) {
      cocoConfig.confidenceThreshold = options.confidenceThreshold;
      wasteConfig.confidenceThreshold = options.confidenceThreshold;
    }
    if (options?.nmsThreshold) {
      cocoConfig.nmsThreshold = options.nmsThreshold;
      wasteConfig.nmsThreshold = options.nmsThreshold;
    }

    // Run models in parallel
    const promises: Promise<Detection[]>[] = [
      runModel(_cocoSession!, tensor, inputSize, _cocoClasses, cocoConfig, origWidth, origHeight, "onnx-coco"),
    ];
    if (runBoth && _wasteSession) {
      promises.push(
        runModel(_wasteSession!, tensor, inputSize, _wasteClasses, wasteConfig, origWidth, origHeight, "onnx-waste")
      );
    }

    const results = await Promise.all(promises);
    const allDetections = results.flat();

    // Sort by confidence descending
    allDetections.sort((a, b) => b.confidence - a.confidence);

    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

    // Environmental assessment
    const envIndicators = allDetections
      .filter((d) => {
        if (d.source === "onnx-waste") return WASTE_ENV_KEYWORDS.has(d.label);
        return COCO_ENV_KEYWORDS.has(d.label);
      })
      .map((d) => d.label);

    const hasEnvConcern = envIndicators.length > 0;

    // Composite confidence (simplified version of server-side logic)
    const maxConf = allDetections.length > 0 ? allDetections[0].confidence : 0;
    const composite = Math.round(
      (maxConf * 0.6 + (hasEnvConcern ? 0.3 : 0) + (runBoth ? 0.1 : 0)) * 10000
    ) / 10000;

    let disposition: "auto_routed" | "pending_review" | "auto_dismissed";
    if (composite >= 0.70) disposition = "auto_routed";
    else if (composite >= 0.40) disposition = "pending_review";
    else disposition = "auto_dismissed";

    setStatus("ready");

    return {
      detections: allDetections.slice(0, 50),
      detection_count: allDetections.length,
      latency_ms: latencyMs,
      model: runBoth ? "yolov8s-coco+waste (on-device)" : "yolov8s-coco (on-device)",
      has_environmental_concern: hasEnvConcern,
      environmental_indicators: [...new Set(envIndicators)],
      composite_confidence: composite,
      triage_disposition: disposition,
    };
  } catch (err) {
    setStatus("error");
    throw err;
  }
}

/**
 * Run inference using only the waste model (lighter, faster).
 */
export async function inferWasteOnly(
  imageDataUrl: string,
  confidenceThreshold?: number
): Promise<InferenceResult> {
  return inferOnDevice(imageDataUrl, {
    confidenceThreshold,
    runBoth: false,
  });
}

/**
 * Get the names of loaded models.
 */
export function getLoadedModels(): string[] {
  const models: string[] = [];
  if (_cocoSession) models.push("coco");
  if (_wasteSession) models.push("waste");
  return models;
}

/**
 * Dispose of ONNX sessions and free memory.
 */
export async function disposeOnnx(): Promise<void> {
  if (_cocoSession) {
    await _cocoSession.release();
    _cocoSession = null;
  }
  if (_wasteSession) {
    await _wasteSession.release();
    _wasteSession = null;
  }
  _ortModule = null;
  setStatus("idle");
}
