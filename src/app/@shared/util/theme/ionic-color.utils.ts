interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface IonicColorSet {
  base: string;
  rgb: string;
  contrast: string;
  contrastRgb: string;
  shade: string;
  tint: string;
}

function parseHex(hex: string): Rgb {
  const digits = /^#?([a-f\d]{6})$/i.exec(hex)?.[1];
  if (!digits) throw new Error(`Not a 6-digit hex color: ${hex}`);
  const channelAt = (at: number): number =>
    Number.parseInt(digits.slice(at, at + 2), 16);
  return { r: channelAt(0), g: channelAt(2), b: channelAt(4) };
}

function toHexChannel(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function toHex({ r, g, b }: Rgb): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function toRgbString({ r, g, b }: Rgb): string {
  return `${r}, ${g}, ${b}`;
}

function mixChannelToward(
  channel: number,
  target: number,
  ratio: number
): number {
  return Math.round(channel + (target - channel) * ratio);
}

function mixToward(rgb: Rgb, target: number, ratio: number): Rgb {
  return {
    r: mixChannelToward(rgb.r, target, ratio),
    g: mixChannelToward(rgb.g, target, ratio),
    b: mixChannelToward(rgb.b, target, ratio),
  };
}

function deriveShade(rgb: Rgb): Rgb {
  return mixToward(rgb, 0, 0.12);
}

function deriveTint(rgb: Rgb): Rgb {
  return mixToward(rgb, 255, 0.1);
}

function pickContrast(rgb: Rgb): Rgb {
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 128 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

export function deriveIonicColorSet(hex: string): IonicColorSet {
  const base = parseHex(hex);
  const contrast = pickContrast(base);

  return {
    base: toHex(base),
    rgb: toRgbString(base),
    contrast: toHex(contrast),
    contrastRgb: toRgbString(contrast),
    shade: toHex(deriveShade(base)),
    tint: toHex(deriveTint(base)),
  };
}
