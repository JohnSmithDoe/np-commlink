import { Service } from '@angular/core';

@Service()
export class AppReloadService {
  reload(): void {
    globalThis.location.reload();
  }
}
