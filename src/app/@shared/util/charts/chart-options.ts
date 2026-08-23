/* ─── why ─────────────────────────────────────────────────────────
 * Importing this module is what REGISTERS chart.js — the side effect runs
 * once per bundle, and a host that draws its options from here cannot
 * forget it. That coupling is deliberate: `Chart.register` sitting beside
 * each chart was three copies of a global, and a fourth chart that omitted
 * it would render an empty canvas rather than fail.
 * ───────────────────────────────────────────────────────────────── */
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
} as const;

export const HOVER_BY_INDEX = { mode: 'index', intersect: false } as const;

export const LEGEND_BOTTOM = {
  position: 'bottom',
  labels: { boxWidth: 12, padding: 8 },
} as const;

export const COMPACT_AXIS = {
  ticks: { autoSkip: true, maxRotation: 0 },
} as const;
