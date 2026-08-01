import { Injectable } from '@angular/core';
import {
  BarcodeFormat,
  BarcodeScanner,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

/**
 * `cancelled` also covers "the user pointed at nothing" — the plugin reports a
 * dismissed scanner and an empty result identically, and neither warrants a
 * message.
 */
type TScanOutcome =
  | { ok: true; ean: string }
  | { ok: false; reason: 'unsupported' | 'denied' | 'cancelled' | 'error' };

/**
 * mlkit EAN-13 scanner (extracted from kitchen-bot's app.component, where it was
 * disabled behind a hard-coded `isSupported = false`). This is a pure util: it
 * returns the scanned code, leaving the dispatch (open the product-item dialog)
 * to the caller so the service never reaches into the data layer.
 *
 * Distinct from the SIGIL barcode feature (`barcode/`), which only displays an
 * uploaded badge image and does not use the camera.
 */
@Injectable({ providedIn: 'root' })
export class BarcodeScannerService {
  get isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  async isSupported(): Promise<boolean> {
    if (!this.isNativePlatform) return false;
    const { supported } = await BarcodeScanner.isSupported();
    return supported;
  }

  /**
   * Request permission, ensure the Google scanner module is present, then scan
   * a single EAN-13.
   *
   * Returns *why* it produced no code rather than a bare `undefined`: a denied
   * permission and an empty frame need different answers from the caller, and
   * every plugin call here can reject (Play Services missing, module not yet
   * downloaded, scanner UI torn down). Collapsing all of it into one value left
   * the scan button silently dead on the only platform it exists on.
   */
  async scanEan(): Promise<TScanOutcome> {
    try {
      return await this.#attemptScan();
    } catch {
      return { ok: false, reason: 'error' };
    }
  }

  async #attemptScan(): Promise<TScanOutcome> {
    if (!(await this.isSupported()))
      return { ok: false, reason: 'unsupported' };
    if (!(await this.#requestPermissions()))
      return { ok: false, reason: 'denied' };
    await this.#ensureModule();
    return this.#scanBehindPreview();
  }

  // Toggles `body.scanner-active` so the camera preview shows through the
  // (transparent) content — see global.scss.
  async #scanBehindPreview(): Promise<TScanOutcome> {
    document.body.classList.add('scanner-active');
    try {
      return await this.#firstEanAsOutcome();
    } finally {
      document.body.classList.remove('scanner-active');
    }
  }

  async #firstEanAsOutcome(): Promise<TScanOutcome> {
    const ean = await this.#scanFirstEan();
    return ean ? { ok: true, ean } : { ok: false, reason: 'cancelled' };
  }

  async #scanFirstEan(): Promise<string | undefined> {
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.Ean13],
    });
    return barcodes[0]?.rawValue;
  }

  async #requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async #ensureModule(): Promise<void> {
    const { available } =
      await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    }
  }
}
