// The `barcode` bounded context owns its model (DDD review #1 — the god
// `@shared/types` file is being split so each context holds its own types).
// The SIGIL badge (sheriff-tighten §1): the uploaded/rotated badge image as a
// data URL, persisted under `npc-barcode`.
export interface IBarcodeState {
  dataUrl?: string;
}
