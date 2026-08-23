import { readStoragePersistence } from './durable-storage';

const withStorage = (storage: unknown) =>
  Object.defineProperty(navigator, 'storage', {
    value: storage,
    configurable: true,
  });

describe('readStoragePersistence', () => {
  afterEach(() => withStorage(undefined));

  it('reads granted and denied off the browser answer', async () => {
    withStorage({ persisted: () => Promise.resolve(true) });
    expect(await readStoragePersistence()).toBe('granted');

    withStorage({ persisted: () => Promise.resolve(false) });
    expect(await readStoragePersistence()).toBe('denied');
  });

  it('reports unsupported where the API is absent', async () => {
    withStorage(undefined);
    expect(await readStoragePersistence()).toBe('unsupported');
  });

  it('reports unsupported rather than throwing', async () => {
    withStorage({ persisted: () => Promise.reject(new Error('blocked')) });
    expect(await readStoragePersistence()).toBe('unsupported');
  });
});
