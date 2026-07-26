// Published dashboard-telemetry contract — the ONLY dashboard type that
// belongs to @shared, because the nine supplier contexts dispatch it. A program
// reports a `source` (its context id, used for grouping), an optional `status`,
// and a bag of display `metrics` (numbers or strings) the deck renders.
//
// The read-model types this feeds (IDashboardSummary, IDashboardState) live in
// `commlink/model` alongside the slice that owns them — sharing them would put
// a specific reader's shapes in the domain-blind kernel.
export type IDashboardTelemetry = {
  source: string;
  status?: 'online' | 'standby';
  metrics: Record<string, number | string>;
};
