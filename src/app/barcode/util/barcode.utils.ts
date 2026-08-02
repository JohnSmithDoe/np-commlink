const RADIANS_PER_DEGREE = Math.PI / 180;

const FALLBACK_MIME_TYPE = 'image/png';
const LOSSY_QUALITY = 0.92;

const loadImage = async (source: string): Promise<HTMLImageElement> => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.addEventListener('load', resolve);
    img.addEventListener('error', reject);
    img.src = source;
  });
  return img;
};

const readAsDataUrl = (file: File): Promise<string | undefined> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () =>
      resolve(reader.result as string | undefined)
    );
    reader.addEventListener('error', () => resolve(undefined));
    reader.readAsDataURL(file);
  });

const mimeTypeOf = (dataUrl: string): string =>
  /^data:(image\/[\w.+-]+)[,;]/.exec(dataUrl)?.[1] ?? FALLBACK_MIME_TYPE;

const rotatedFrame = (img: HTMLImageElement, radians: number) => {
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  return {
    width: Math.round(img.naturalWidth * cos + img.naturalHeight * sin),
    height: Math.round(img.naturalWidth * sin + img.naturalHeight * cos),
  };
};

export const readBadgeImage = async (
  file: File
): Promise<string | undefined> => {
  const dataUrl = await readAsDataUrl(file);
  if (!dataUrl) return;
  try {
    await loadImage(dataUrl);
  } catch {
    return;
  }
  return dataUrl;
};

export const rotateBase64 = async (dataUrl?: string, deg = 90) => {
  if (!dataUrl) return;

  const img = await loadImage(dataUrl);
  const radians = (deg % 360) * RADIANS_PER_DEGREE;
  const { width, height } = rotatedFrame(img, radians);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.translate(width / 2, height / 2);
  context.rotate(radians);
  context.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return canvas.toDataURL(mimeTypeOf(dataUrl), LOSSY_QUALITY);
};
