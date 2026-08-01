import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppReloadService } from './app-reload.service';
import { AppUpdateService } from './app-update.service';

const versionReady = (): VersionEvent =>
  ({
    type: 'VERSION_READY',
    currentVersion: { hash: 'old' },
    latestVersion: { hash: 'new' },
  }) as VersionEvent;

describe('AppUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let activateUpdate: ReturnType<typeof vi.fn>;
  let reload: ReturnType<typeof vi.fn>;

  const serviceWith = (isEnabled: boolean): AppUpdateService => {
    versionUpdates = new Subject<VersionEvent>();
    activateUpdate = vi.fn(async () => true);
    reload = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AppUpdateService,
        {
          provide: SwUpdate,
          useValue: { isEnabled, versionUpdates, activateUpdate },
        },
        { provide: AppReloadService, useValue: { reload } },
      ],
    });
    return TestBed.inject(AppUpdateService);
  };

  it('offers the build once ngsw reports one is ready', () => {
    const service = serviceWith(true);
    expect(service.updateReady()).toBe(false);

    versionUpdates.next(versionReady());

    expect(service.updateReady()).toBe(true);
  });

  // Every other event type crosses the same stream (VERSION_DETECTED fires
  // while the new assets are still downloading), and offering a reload then
  // would serve a half-fetched version.
  it('ignores versions that are not ready yet', () => {
    const service = serviceWith(true);

    versionUpdates.next({
      type: 'VERSION_DETECTED',
      version: { hash: 'new' },
    } as VersionEvent);

    expect(service.updateReady()).toBe(false);
  });

  // `ng serve`, specs and the APK all report disabled. Subscribing there would
  // be harmless, but `activateUpdate()` throws — so nothing may reach the shell.
  it('stays inert where no service worker runs', () => {
    const service = serviceWith(false);

    versionUpdates.next(versionReady());

    expect(service.updateReady()).toBe(false);
  });

  it('activates before reloading, because activating alone swaps nothing', async () => {
    const service = serviceWith(true);
    versionUpdates.next(versionReady());

    service.applyUpdate();
    await Promise.resolve();

    expect(activateUpdate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  // A failed activation must not leave a prompt up that cannot work.
  it('withdraws the offer when activation fails', async () => {
    const service = serviceWith(true);
    activateUpdate.mockRejectedValueOnce(new Error('no worker'));
    versionUpdates.next(versionReady());

    service.applyUpdate();
    await Promise.resolve();
    await Promise.resolve();

    expect(reload).not.toHaveBeenCalled();
    expect(service.updateReady()).toBe(false);
  });

  it('can be dismissed without reloading', () => {
    const service = serviceWith(true);
    versionUpdates.next(versionReady());

    service.dismiss();

    expect(service.updateReady()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
