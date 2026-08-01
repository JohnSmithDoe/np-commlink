import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { barcodeContext } from '../data';

/**
 * SIGIL — the uploaded badge image. Its own sealed single-slice context (it
 * used to be a field inside office-time), so it carries its own state +
 * hydration and needs no cross-domain bridge.
 */
export const barcodeRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.barcode'),
    ...barcodeContext,
    loadComponent: () =>
      import('../feature/barcode-page/barcode.page').then((m) => m.BarcodePage),
  },
];
