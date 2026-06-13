interface StampMetadata {
  latitude: number;
  longitude: number;
  ghostMode: boolean;
  reportId?: string;
}

/**
 * Captures a photo from a video element with AR metadata stamp.
 * Draws the video frame onto a canvas, then overlays:
 * - Semi-transparent black bar at bottom
 * - GPS coordinates
 * - ISO timestamp
 * - "EVIDENCE CAPTURE" label at top
 * - Ghost Mode watermark (if enabled)
 * - Report ID (if provided)
 * Returns a data URL (JPEG, 90% quality).
 */
export function captureWithStamp(
  video: HTMLVideoElement,
  metadata: StampMetadata
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;

  // Draw camera frame
  ctx.drawImage(video, 0, 0);

  // Draw semi-transparent overlay bar at bottom (120px)
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

  // Draw "EVIDENCE CAPTURE" label at top
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, 50);
  ctx.fillStyle = "#ef4444"; // red dot
  ctx.beginPath();
  ctx.arc(30, 25, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px monospace";
  ctx.fillText("EVIDENCE CAPTURE", 50, 32);

  // Draw metadata at bottom
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px monospace";
  // In Ghost Mode, hide GPS coordinates from the visual stamp
  if (!metadata.ghostMode) {
    ctx.fillText(`\u{1F4CD} ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`, 20, canvas.height - 80);
  } else {
    ctx.fillText(`\u{1F4CD} [COORDINATES HIDDEN]`, 20, canvas.height - 80);
  }
  ctx.fillText(`\u{1F550} ${new Date().toISOString()}`, 20, canvas.height - 50);
  if (metadata.reportId) {
    ctx.fillText(`\u{1F4CB} ${metadata.reportId}`, 20, canvas.height - 20);
  }

  // Ghost Mode watermark (rotated, semi-transparent)
  if (metadata.ghostMode) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.font = "bold 80px sans-serif";
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6); // -30 degrees
    ctx.textAlign = "center";
    ctx.fillText("GHOST MODE", 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Extracts the base64 data from a data URL.
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] || dataUrl;
}
