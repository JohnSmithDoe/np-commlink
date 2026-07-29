import { inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { AppReloadService } from './app-reload.service';

/**
 * Announces a newly downloaded build once ngsw reports it is ready to serve, so
 * the shell can offer it.
 *
 * It has to ship in the *first* release: a client can only ever be told about
 * the next version by code that was already in the version it is running, so an
 * updater added later arrives a generation too late for everyone it was meant to
 * reach.
 *
 * What it buys is narrower than it looks, and worth stating so nobody widens it
 * by mistake: ngsw does not pin a client forever — a fresh page load activates
 * the newest ready version by itself. The case that never gets a fresh load is
 * an installed PWA that is never fully closed, and that is the one this is for.
 *
 * Store-free by design, like its `@shared/util` siblings (`theme.service`,
 * `splash.service`): a browser-global adapter every layer may read.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  readonly #updates = inject(SwUpdate);
  readonly #reload = inject(AppReloadService);

  readonly #ready = signal(false);
  readonly updateReady: Signal<boolean> = this.#ready.asReadonly();

  constructor() {
    this.#announceReadyVersions();
  }

  /**
   * Swapping the assets is the reload, not `activateUpdate()` — that only tells
   * ngsw which version to serve *subsequent* requests, so a tab left running
   * would keep the old bundle with a new worker underneath it.
   */
  applyUpdate(): void {
    void this.#updates
      .activateUpdate()
      .then(() => this.#reload.reload())
      .catch(() => this.#ready.set(false));
  }

  dismiss(): void {
    this.#ready.set(false);
  }

  // Inert wherever no service worker runs — `ng serve`, specs, and the APK,
  // whose assets are replaced by an install rather than by ngsw. `SwUpdate`
  // throws on `activateUpdate()` when disabled, and `versionUpdates` is a stream
  // that would never emit, so the guard is the whole contract on those targets.
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
