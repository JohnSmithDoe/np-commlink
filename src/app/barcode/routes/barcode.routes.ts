import { Routes } from '@angular/router';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { barcodeContext } from '../data';

export const barcodeRoutes: Routes = [
  {
    path: '',
    title: marker('page-title.barcode'),
    ...barcodeContext,
    loadComponent: () =>
      import('../feature/barcode-page/barcode.page').then((m) => m.BarcodePage),
  },
];
