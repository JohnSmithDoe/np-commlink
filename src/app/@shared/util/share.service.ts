import { Injectable } from '@angular/core';
import { Share, ShareOptions } from '@capacitor/share';

/**
 * The OS share sheet, behind a port.
 *
 * Two domains export through it (tracking's CSV, shopping's list), and both used
 * to import the plugin into their effects directly. That left the specs no seam
 * but `vi.mock('@capacitor/share')` — and the Capacitor proxy cannot be spied on
 * either, because its `get` trap manufactures a fresh method wrapper per read
 * and never consults the target. Under this runner's `isolate: false`, a module
 * mock is shared across spec files, so whether it was installed depended on file
 * order and the tracking effects spec failed roughly one run in two.
 *
 * A DI port is stubbed per TestBed instead, which is deterministic.
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  /** Rejects when the user dismisses the sheet — callers swallow that. */
  share(options: ShareOptions): Promise<unknown> {
    return Share.share(options);
  }
}
