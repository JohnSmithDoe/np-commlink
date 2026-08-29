/* ─── why ─────────────────────────────────────────────────────────
 * `series` is CATEGORICAL and holds none of the semantic hues, which it used
 * to share: the report draws income in success and spend in danger, then drew
 * its category ring from a rotation containing both, so the third category on
 * the screen wore the colour that meant income two charts above it. A slice
 * colour says which category, never whether the number is good.
 * ───────────────────────────────────────────────────────────────── */

interface ChartColors {
  income: string;
  spend: string;
  series: string[];
}

export function chartColors(): ChartColors {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    css.getPropertyValue(name).trim() || fallback;

  const amber = read('--ion-color-primary', '#de8b27');
  const cyan = read('--ion-color-secondary', '#32aea6');
  const success = read('--ion-color-success', '#2d7c3e');
  const danger = read('--ion-color-danger', '#eb445a');

  return {
    income: success,
    spend: danger,
    series: [
      amber,
      cyan,
      '#7044ff',
      '#c74ea8',
      '#4a7fd4',
      '#a9714b',
      '#92949c',
    ],
  };
}
