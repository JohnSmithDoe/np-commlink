import { inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { AppReloadService } from './app-reload.service';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  readonly #updates = inject(SwUpdate);
  readonly #reload = inject(AppReloadService);

  readonly #ready = signal(false);
  readonly updateReady: Signal<boolean> = this.#ready.asReadonly();

  constructor() {
    this.#announceReadyVersions();
  }

  applyUpdate(): void {
    void this.#updates
      .activateUpdate()
      .then(() => this.#reload.reload())
      .catch(() => this.#ready.set(false));
  }

  dismiss(): void {
    this.#ready.set(false);
  }

  #announceReadyVersions(): void {
    if (!this.#updates.isEnabled) return;

    this.#updates.versionUpdates
      .pipe(
        filter(
          (event): event is VersionReadyEvent => event.type === 'VERSION_READY'
        ),
        takeUntilDestroyed()
      )
      .subscribe(() => this.#ready.set(true));
  }
}
