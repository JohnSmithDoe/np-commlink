import { TestBed } from '@angular/core/testing';
import { LanguageModelService } from './language-model.service';

type TGlobalWithModel = typeof globalThis & { LanguageModel?: unknown };

const withLanguageModel = (stub: unknown): (() => void) => {
  const target = globalThis as TGlobalWithModel;
  const had = 'LanguageModel' in target;
  const previous = target.LanguageModel;
  target.LanguageModel = stub;
  return () => {
    if (had) target.LanguageModel = previous;
    else delete target.LanguageModel;
  };
};

describe('LanguageModelService', () => {
  let restore: (() => void) | undefined;

  const serviceWith = (stub: unknown): LanguageModelService => {
    restore = withLanguageModel(stub);
    TestBed.configureTestingModule({ providers: [LanguageModelService] });
    return TestBed.inject(LanguageModelService);
  };

  afterEach(() => {
    restore?.();
    restore = undefined;
  });

  it('publishes what the runtime reports', async () => {
    const service = serviceWith({ availability: async () => 'available' });

    expect(await service.probe()).toBe('available');
    expect(service.availability()).toBe('available');
  });

  // The probe is memoized, so an escaping rejection would be cached forever:
  // every reader stays on 'probing', the deck tile never resolves, and the
  // constructor's fire-and-forget call becomes an unhandled rejection.
  it('reports unavailable when the experimental API throws', async () => {
    const service = serviceWith({
      availability: async () => {
        throw new Error('not implemented');
      },
    });

    expect(await service.probe()).toBe('unavailable');
    expect(service.availability()).toBe('unavailable');
  });

  it('probes once and shares the answer', async () => {
    const availability = vi.fn(async () => 'downloadable');
    const service = serviceWith({ availability });

    await Promise.all([service.probe(), service.probe(), service.probe()]);

    // One extra call is the constructor's own probe.
    expect(availability.mock.calls.length).toBeLessThanOrEqual(1);
  });

  // A successful create is proof the model is on-device, even if the last
  // probe reported 'downloadable' — shared readers (the deck tile) shouldn't
  // keep reporting standby for the rest of the session.
  it('marks the model available once a session is created', async () => {
    const session = { destroy: vi.fn() };
    const service = serviceWith({
      availability: async () => 'downloadable',
      create: async () => session,
    });
    await service.probe();
    expect(service.availability()).toBe('downloadable');

    await service.createSession({});

    expect(service.availability()).toBe('available');
  });
});
