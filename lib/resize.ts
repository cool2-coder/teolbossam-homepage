/** Shrinks a phone photo to at most `max` px on the long side as JPEG (runs in the browser). */
export async function resizeImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("사진 파일만 올릴 수 있어요.");
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions).catch(() => null);
  let w: number, h: number, src: CanvasImageSource;
  if (bmp) {
    w = bmp.width; h = bmp.height; src = bmp;
  } else {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    w = img.naturalWidth; h = img.naturalHeight; src = img;
  }
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(src, 0, 0, canvas.width, canvas.height);
  return await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("사진을 줄이지 못했어요."))), "image/jpeg", quality),
  );
}

/** Center-crops a photo to a square of `size` px (for profile pictures). */
export async function squareImage(file: File, size = 600, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const s = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(size, s);
  canvas.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, canvas.width, canvas.height);
  return await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("사진을 줄이지 못했어요."))), "image/jpeg", quality),
  );
}
