export async function stripExif(base64Image: string): Promise<string> {
  if (!base64Image.startsWith("data:")) {
    throw new Error("Expected a data URL base64 image string.");
  }

  const image = new Image();
  image.decoding = "async";
  image.src = base64Image;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to decode image data."));
  });

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to access canvas context.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9+.-]+);/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";
  const quality = mimeType === "image/jpeg" ? 1 : undefined;

  return canvas.toDataURL(mimeType, quality);
}
