/**
 * Public API of the `barcode` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the facade and the lazy context bundle,
 * and nothing else. The reducer, effects, actions, initial state, and the raw
 * feature selector are module internals and stay hidden: importing them from
 * outside `barcode/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { BarcodeFacade } from './barcode.facade';
export { barcodeContext } from './barcode.providers';
