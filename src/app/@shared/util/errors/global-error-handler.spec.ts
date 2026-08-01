import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { AppReloadService } from '../service-worker/app-reload.service';
import { GlobalErrorHandler } from './global-error-handler';

type TAlertButton = { text?: string; handler?: () => void };
type TPresentedAlert = {
  header: string;
  message: string;
  backdropDismiss?: boolean;
  buttons: TAlertButton[];
};

// The alert is created from an async method the handler deliberately does not
// await, so every assertion has to outlast that microtask.
const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let alert: { present: ReturnType<typeof vi.fn> };
  let alerts: { create: ReturnType<typeof vi.fn> };
  let reload: { reload: ReturnType<typeof vi.fn> };
  let logged: ReturnType<typeof vi.spyOn>;

  // Throwing beats a cast: under `noUncheckedIndexedAccess` an unpresented alert
  // is `undefined`, and a spec that reads on should say so rather than fail later
  // on a property of nothing.
  const presented = (): TPresentedAlert => {
    const [firstCall] = alerts.create.mock.calls;
    if (!firstCall) throw new Error('no alert was presented');
    return firstCall[0] as TPresentedAlert;
  };

  beforeEach(() => {
    alert = { present: vi.fn().mockResolvedValue(undefined) };
    alerts = { create: vi.fn().mockResolvedValue(alert) };
    reload = { reload: vi.fn() };
    // Returning the key keeps the assertions about *which* key and *which*
    // params, not about wording.
    const translate = { instant: vi.fn((key: string) => key) };
    logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: AlertController, useValue: alerts },
        { provide: TranslateService, useValue: translate },
        { provide: AppReloadService, useValue: reload },
      ],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  afterEach(() => logged.mockRestore());

  it('logs every error it handles', async () => {
    const boom = new Error('boom');
    handler.handleError(boom);
    await settle();

    expect(logged).toHaveBeenCalledWith(boom);
  });

  it('presents one undismissable alert offering only a reload', async () => {
    handler.handleError(new Error('boom'));
    await settle();

    expect(alerts.create).toHaveBeenCalledTimes(1);
    expect(alert.present).toHaveBeenCalledTimes(1);
    expect(presented().backdropDismiss).toBe(false);
    expect(presented().buttons).toHaveLength(1);
  });

  it('reports what broke by passing the reason to the message', async () => {
    handler.handleError(new Error('storage is unavailable'));
    await settle();

    const translate = TestBed.inject(TranslateService);
    expect(translate.instant).toHaveBeenCalledWith('error.uncaught.message', {
      reason: 'storage is unavailable',
    });
  });

  // A rejected promise can carry anything, so the reason must survive a value
  // that is not an Error.
  it.each([
    ['a bare string', 'just a string', 'just a string'],
    ['undefined', undefined, 'undefined'],
  ])('reads a reason out of %s', async (_label, thrown, expected) => {
    handler.handleError(thrown);
    await settle();

    const translate = TestBed.inject(TranslateService);
    expect(translate.instant).toHaveBeenCalledWith('error.uncaught.message', {
      reason: expected,
    });
  });

  it('reloads the app when the button is taken', async () => {
    handler.handleError(new Error('boom'));
    await settle();

    const [reloadButton] = presented().buttons;
    reloadButton?.handler?.();

    // Not reached if the button went missing — the count below is what fails,
    // so the optional chaining above cannot turn this green by accident.
    expect(reload.reload).toHaveBeenCalledTimes(1);
  });

  // The case the guard exists for: an errored `computed` re-throws on every read,
  // so this arrives once per change-detection cycle.
  it('still logs a repeat error but presents no second alert', async () => {
    handler.handleError(new Error('first'));
    await settle();
    handler.handleError(new Error('second'));
    await settle();

    expect(alerts.create).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledTimes(2);
  });

  // Re-throwing here would re-enter Angular's error path.
  it('swallows a failure to present, having already logged', async () => {
    alerts.create.mockRejectedValue(new Error('no overlay'));

    expect(() => handler.handleError(new Error('boom'))).not.toThrow();
    await settle();

    expect(logged).toHaveBeenCalledTimes(1);
  });
});
