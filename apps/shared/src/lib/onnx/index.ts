/**
 * ONNX on-device inference module for LikasLens.
 *
 * Exports the browser-side YOLOv8 inference engine and React hook
 * for offline-capable environmental violation detection.
 */

export {
  initializeOnnx,
  inferOnDevice,
  inferWasteOnly,
  isOnnxReady,
  getInferenceStatus,
  onInferenceStatusChange,
  getLoadedModels,
  disposeOnnx,
  type Detection,
  type InferenceResult,
  type InferenceStatus,
  type ModelConfig,
} from "./inference";
