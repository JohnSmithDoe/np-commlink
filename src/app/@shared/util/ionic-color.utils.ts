interface IRgb {
  r: number;
  g: number;
  b: number;
}

export interface IIonicColorSet {
  base: string;
  rgb: string;
  contrast: string;
  contrastRgb: string;
  shade: string;
  tint: string;
}

// One capture group and three slices rather than three capture groups: a
// `RegExpExecArray` index is `string | undefined` however many groups the pattern
// declares, while `String.slice` is total — so the channels are read as the
// `string`s they are, with no guard for a case the pattern already excluded.
function parseHex(hex: string): IRgb {
  const digits = /^#?([a-f\d]{6})$/i.exec(hex)?.[1];
  if (!digits) throw new Error(`Not a 6-digit hex color: ${hex}`);
  const channelAt = (at: number): number =>
    Number.parseInt(digits.slice(at, at + 2), 16);
  return { r: channelAt(0), g: channelAt(2), b: channelAt(4) };
}

function toHexChannel(value: number): string {
  return value.toString(16).padStart(2, '0');
}

function toHex({ r, g, b }: IRgb): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function toRgbString({ r, g, b }: IRgb): string {
  return `${r}, ${g}, ${b}`;
}

function mixChannelToward(
  channel: number,
  target: number,
  ratio: number
): number {
  return Math.round(channel + (target - channel) * ratio);
}

function mixToward(rgb: IRgb, target: number, ratio: number): IRgb {
  return {
    r: mixChannelToward(rgb.r, target, ratio),
    g: mixChannelToward(rgb.g, target, ratio),
    b: mixChannelToward(rgb.b, target, ratio),
  };
}

// Ionic's generator shade/tint: 12% toward black, 10% toward white per channel
// — verified against the shipped tuples in src/theme/variables.scss.
function deriveShade(rgb: IRgb): IRgb {
  return mixToward(rgb, 0, 0.12);
}

function deriveTint(rgb: IRgb): IRgb {
  return mixToward(rgb, 255, 0.1);
}

// YIQ luminance threshold for contrast text, verified against every shipped
// tuple in src/theme/variables.scss (incl. the deck's teal secondary,
// #32aea6, whose YIQ≈136 sits close enough to the boundary that a wrong
// threshold would flip it).
function pickContrast(rgb: IRgb): IRgb {
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 128 ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

/** Hex → the full set of `--ion-color-*` derivatives Ionic needs for one color. */
export function deriveIonicColorSet(hex: string): IIonicColorSet {
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
