interface StampMetadata {
  latitude: number;
  longitude: number;
  ghostMode: boolean;
  reportId?: string;
}

/**
 * Captures a photo from a video element with AR metadata stamp in portrait orientation.
 */
export function captureWithStamp(
  video: HTMLVideoElement,
  metadata: StampMetadata
): string {
  const canvas = document.createElement("canvas");
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // Calculate true portrait crop matching mobile viewport (3:4 ratio or sensor height)
  let sx = 0;
  let sy = 0;
  let sWidth = vw;
  let sHeight = vh;

  if (vw > vh) {
    // Sensor is landscape (e.g. 1920x1080) -> crop center 3:4 portrait slice (810x1080)
    const targetAspect = 3 / 4;
    sWidth = Math.round(vh * targetAspect);
    sHeight = vh;
    sx = Math.round((vw - sWidth) / 2);
    sy = 0;
    canvas.width = sWidth;
    canvas.height = sHeight;
  } else {
    // Sensor is already portrait or square
    canvas.width = vw;
    canvas.height = vh;
  }

  const ctx = canvas.getContext("2d")!;

  // 1. Draw cropped portrait camera frame
  ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

  const scale = Math.max(canvas.width / 720, 0.75);

  // 2. Sleek top evidence header
  const topH = Math.round(38 * scale);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvas.width, topH);
  
  // Red live indicator dot
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(Math.round(18 * scale), Math.round(topH / 2), Math.round(5 * scale), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(13 * scale)}px sans-serif`;
  ctx.fillText("LIKASLENS EVIDENCE CAPTURE", Math.round(30 * scale), Math.round(topH / 2 + 5 * scale));

  // 3. Bottom metadata stamp bar (gradient overlay)
  const botH = Math.round(75 * scale);
  const botGrad = ctx.createLinearGradient(0, canvas.height - botH, 0, canvas.height);
  botGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
  botGrad.addColorStop(0.3, "rgba(0, 0, 0, 0.65)");
  botGrad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, canvas.height - botH, canvas.width, botH);

  // Bottom coordinates and timestamp
  ctx.fillStyle = "#ffffff";
  ctx.font = `${Math.round(12 * scale)}px monospace`;
  
  const padX = Math.round(14 * scale);
  if (!metadata.ghostMode) {
    ctx.fillText(`\u{1F4CD} ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}`, padX, canvas.height - Math.round(34 * scale));
  } else {
    ctx.fillStyle = "#2dd4bf";
    ctx.fillText(`\u{1F4CD} [COORDINATES ENCRYPTED - GHOST MODE]`, padX, canvas.height - Math.round(34 * scale));
    ctx.fillStyle = "#ffffff";
  }
  
  const timeStr = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  ctx.fillText(`\u{1F550} ${timeStr}`, padX, canvas.height - Math.round(14 * scale));

  // Ghost Mode diagonal watermark if enabled
  if (metadata.ghostMode) {
    ctx.save();
    ctx.fillStyle = "rgba(45, 212, 191, 0.18)";
    ctx.font = `bold ${Math.round(48 * scale)}px sans-serif`;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = "center";
    ctx.fillText("GHOST SHIELD PROTECTED", 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Extracts the base64 data from a data URL.
 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] || dataUrl;
}
