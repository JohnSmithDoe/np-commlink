import { Injectable } from '@angular/core';
import {
  BarcodeFormat,
  BarcodeScanner,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

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
   * a single EAN-13. Returns the raw code, or `undefined` if unsupported /
   * denied / cancelled. Toggles `body.scanner-active` so the camera preview
   * shows through the (transparent) content — see global.scss.
   */
  async scanEan(): Promise<string | undefined> {
    if (!(await this.isSupported())) return undefined;
    if (!(await this.#requestPermissions())) return undefined;
    await this.#ensureModule();

    document.body.classList.add('scanner-active');
    try {
      return await this.#scanFirstEan();
    } finally {
      document.body.classList.remove('scanner-active');
    }
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
