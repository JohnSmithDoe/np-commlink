import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppReloadService {
  reload(): void {
    globalThis.location.reload();
  }
}
