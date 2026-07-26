import { IDashboardTelemetry } from '../../@shared/model/dashboard.types';

// The commlink-owned dashboard read-model types. Only `IDashboardTelemetry` —
// the published telemetry contract the nine supplier contexts dispatch — stays
// in @shared; the state these two describe is read by the deck and the shell
// badge alone, so it belongs to the reader.

// Persisted read-model doc (one `npc-summary-<source>` key each). The
// persistence model deliberately drops `status`: a summary on disk is cold, so
// it can only ever hydrate to `standby`; `online` is stamped by a live
// `report`. Persisting metrics only keeps the standby→online lifecycle
// structurally enforced by the reducer rather than by remembering to strip a
// field on the way to disk.
export type IDashboardSummary = {
  source: string;
  metrics: IDashboardTelemetry['metrics'];
};

// Eager dashboard read-model (CQRS). Latest telemetry per source. Hydrated at
// boot from the persisted summary docs (at `standby`) so the deck can render
// cold-launch numbers before any producing module loads; live `report`s then
// flip sources to `online`.
export interface IDashboardState {
  bySource: Record<string, IDashboardTelemetry>;
}

// The key family this context owns in the shared per-key store. `DatabaseService`
// prepends `npc-`, so these resolve to `npc-summary-<source>`. Kept here rather
// than in the port: a domain owns its own keyspace, the port just stores bytes.
export const SUMMARY_KEY_PREFIX = 'summary-';
export const summaryKey = (source: string): string =>
  SUMMARY_KEY_PREFIX + source;
