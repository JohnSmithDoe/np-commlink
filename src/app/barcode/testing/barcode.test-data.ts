import { IBarcodeState } from '../model';

// Deterministic barcode fixture, owned by the barcode context (DDD review #1):
// the shared @shared/testing kit is domain:shared and may not reference a
// domain type.
export function mockBarcodeState(
  overrides: Partial<IBarcodeState> = {}
): IBarcodeState {
  return { ...overrides };
}
