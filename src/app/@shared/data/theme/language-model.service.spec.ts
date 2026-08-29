import { TestBed } from '@angular/core/testing';
import { LANGUAGES } from '../../model/app.types';
import { LanguageModelService } from './language-model.service';

const allLanguages = [...LANGUAGES];

type GlobalWithModel = typeof globalThis & { LanguageModel?: unknown };

const withLanguageModel = (stub: unknown): (() => void) => {
  const target = globalThis as GlobalWithModel;
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

  it('reports unavailable when the experimental API throws', async () => {
    const service = serviceWith({
      availability: async () => {
        throw new Error('not implemented');
      },
    });

    expect(await service.probe()).toBe('unavailable');
    expect(service.availability()).toBe('unavailable');
  });

  it('probes for every app language, which Chrome warns about only at runtime', async () => {
    const availability = vi.fn(async () => 'available');
    const service = serviceWith({ availability });

    await service.probe();

    expect(availability).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedOutputs: [{ type: 'text', languages: allLanguages }],
      })
    );
  });

  it('narrows a session to the output language it is asked for', async () => {
    const create = vi.fn(async () => ({ destroy: vi.fn() }));
    const service = serviceWith({
      availability: async () => 'available',
      create,
    });

    await service.createSession({}, ['en']);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedInputs: [{ type: 'text', languages: allLanguages }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
      })
    );
  });

  it('probes once and shares the answer', async () => {
    const availability = vi.fn(async () => 'downloadable');
    const service = serviceWith({ availability });

    await Promise.all([service.probe(), service.probe(), service.probe()]);

    expect(availability.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('marks the model available once a session is created', async () => {
    const session = { destroy: vi.fn() };
    const service = serviceWith({
      availability: async () => 'downloadable',
      create: async () => session,
    });
    await service.probe();
    expect(service.availability()).toBe('downloadable');

    await service.createSession({}, ['de']);

    expect(service.availability()).toBe('available');
  });
});
