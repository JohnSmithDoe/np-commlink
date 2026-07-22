// Canvas-based rotation of a base64/data-URL image. Relocated from
// office-time.utils when the SIGIL badge got its own bounded context
// (sheriff-tighten §1) so barcode no longer bridges into office-time.
// Self-contained: uses only Image/canvas — no domain dependencies.
export const rotateBase64 = async (dataUrl?: string, deg = 90) => {
  if (!dataUrl) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    img.addEventListener('load', res);
    img.addEventListener('error', rej);
    img.src = dataUrl.startsWith('data:')
      ? dataUrl
      : `data:image/*;base64,${dataUrl}`;
  });

  const radians = ((deg % 360) * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // canvas size of rotated bounding box
  const cw = Math.round(w * cos + h * sin);
  const ch = Math.round(w * sin + h * cos);

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const context = canvas.getContext('2d');

  context?.translate(cw / 2, ch / 2);
  context?.rotate(radians);
  context?.drawImage(img, -w / 2, -h / 2);

  return canvas.toDataURL('image/*');
};
