/**
 * Public API of the `barcode` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the display
 * selector, and the lazy providers, and nothing else. The reducer, effects,
 * load effect, initial state, and the raw feature selector are module
 * internals and stay hidden: importing them from outside `barcode/data` is a
 * Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { BarcodeActions } from './barcode.actions';
export { selectBarcodeDataUrl } from './barcode.selector';
export { barcodeLazyProviders } from './provide-barcode-lazy';
