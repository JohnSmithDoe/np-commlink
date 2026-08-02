import { Injectable } from '@angular/core';
import {
  BarcodeFormat,
  BarcodeScanner,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

type ScanOutcome =
  | { ok: true; ean: string }
  | { ok: false; reason: 'unsupported' | 'denied' | 'cancelled' | 'error' };

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

  async scanEan(): Promise<ScanOutcome> {
    try {
      return await this.#attemptScan();
    } catch {
      return { ok: false, reason: 'error' };
    }
  }

  async #attemptScan(): Promise<ScanOutcome> {
    if (!(await this.isSupported()))
      return { ok: false, reason: 'unsupported' };
    if (!(await this.#requestPermissions()))
      return { ok: false, reason: 'denied' };
    await this.#ensureModule();
    return this.#scanBehindPreview();
  }

  async #scanBehindPreview(): Promise<ScanOutcome> {
    document.body.classList.add('scanner-active');
    try {
      return await this.#firstEanAsOutcome();
    } finally {
      document.body.classList.remove('scanner-active');
    }
  }

  async #firstEanAsOutcome(): Promise<ScanOutcome> {
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
