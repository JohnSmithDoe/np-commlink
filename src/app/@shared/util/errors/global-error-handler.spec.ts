import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { AppReloadService } from '../service-worker/app-reload.service';
import { GlobalErrorHandler } from './global-error-handler';

type AlertButton = { text?: string; handler?: () => void };
type PresentedAlert = {
  header: string;
  message: string;
  backdropDismiss?: boolean;
  buttons: AlertButton[];
};

const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let alert: { present: ReturnType<typeof vi.fn> };
  let alerts: { create: ReturnType<typeof vi.fn> };
  let reload: { reload: ReturnType<typeof vi.fn> };
  let logged: ReturnType<typeof vi.spyOn>;

  const presented = (): PresentedAlert => {
    const [firstCall] = alerts.create.mock.calls;
    if (!firstCall) throw new Error('no alert was presented');
    return firstCall[0] as PresentedAlert;
  };

  beforeEach(() => {
    alert = { present: vi.fn().mockResolvedValue(undefined) };
    alerts = { create: vi.fn().mockResolvedValue(alert) };
    reload = { reload: vi.fn() };
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

    expect(reload.reload).toHaveBeenCalledTimes(1);
  });

  it('still logs a repeat error but presents no second alert', async () => {
    handler.handleError(new Error('first'));
    await settle();
    handler.handleError(new Error('second'));
    await settle();

    expect(alerts.create).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledTimes(2);
  });

  it('swallows a failure to present, having already logged', async () => {
    alerts.create.mockRejectedValue(new Error('no overlay'));

    expect(() => handler.handleError(new Error('boom'))).not.toThrow();
    await settle();

    expect(logged).toHaveBeenCalledTimes(1);
  });
});
