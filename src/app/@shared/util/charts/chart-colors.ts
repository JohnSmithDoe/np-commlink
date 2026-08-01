/**
 * Chart (canvas) colours read from the live Shadowrun theme.
 *
 * chart.js paints on a `<canvas>`, where CSS custom properties do NOT resolve —
 * a `'var(--x)'` fill renders as transparent. So instead of hardcoding
 * Ionic-default hexes we snapshot the computed theme tokens from `:root`, which
 * keeps the charts on the deck palette and lets the Phase-6 palette seam
 * recolour them for free.
 *
 * Read the **leaf** tokens (`--ion-color-*`, `--sr-red`) that hold real hex
 * values — `getComputedStyle().getPropertyValue()` returns a custom property's
 * *specified* value, so an alias like `--sr-amber: var(--ion-color-primary)`
 * would come back as the literal string `"var(--ion-color-primary)"`.
 *
 * Call from a component field/`computed` (i.e. after bootstrap, once the theme
 * is applied to `:root`) — never at module top-level, where styles aren't ready.
 * Each read has a hardcoded fallback matching the current theme value in case
 * the property is momentarily unset.
 */
interface ChartColors {
  /** Positive / income series → the theme's success green. */
  income: string;
  /** Negative / spend series → the theme's danger red. */
  spend: string;
  /** Categorical ramp: leads with the deck neons + theme semantics, then two
   *  fixed accents so longer category/series lists stay distinguishable. */
  series: string[];
}

export function chartColors(): ChartColors {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    css.getPropertyValue(name).trim() || fallback;

  const amber = read('--ion-color-primary', '#de8b27');
  const cyan = read('--ion-color-secondary', '#32aea6');
  const success = read('--ion-color-success', '#2d7c3e');
  const warning = read('--ion-color-warning', '#ffc409');
  const danger = read('--ion-color-danger', '#eb445a');

  return {
    income: success,
    spend: danger,
    series: [amber, cyan, success, warning, danger, '#7044ff', '#92949c'],
  };
}
