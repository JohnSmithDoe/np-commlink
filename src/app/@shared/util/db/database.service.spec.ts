import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { DatabaseService } from './database.service';
import { VERSION } from './migrations';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockStorage: {
    create: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    forEach: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStorage = {
      create: vi.fn().mockResolvedValue(undefined),
      // Default: the persisted schema version already matches, so the one-time
      // fresh-baseline wipe does NOT fire (each test that needs the wipe sets
      // the schema key to a stale value explicitly).
      get: vi
        .fn()
        .mockImplementation(async (key: string) =>
          key === 'npc-schema-version' ? VERSION : null
        ),
      set: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      forEach: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: Storage, useValue: mockStorage },
      ],
    });
    service = TestBed.inject(DatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('save', () => {
    it('persists under the unified "npc-" prefixed key', async () => {
      const value = { showQuickAdd: true } as never;

      await service.save('listSettings', value);

      expect(mockStorage.set).toHaveBeenCalledWith('npc-listSettings', value);
    });

    it('initializes the storage backend before writing', async () => {
      await service.save('listSettings', { showQuickAdd: true } as never);

      expect(mockStorage.create).toHaveBeenCalled();
    });
  });

  describe('loadPrefixed', () => {
    it('returns only the docs whose key matches the "npc-<prefix>" family', async () => {
      mockStorage.forEach.mockImplementation(
        async (callback: (v: unknown, k: string, index: number) => void) => {
          callback(
            { source: 'notifications', metrics: { unread: 2 } },
            'npc-summary-notifications',
            0
          );
          callback({ items: [] }, 'npc-tracking', 1);
          callback(
            { source: 'office-time', metrics: { officedays: 12 } },
            'npc-summary-office-time',
            2
          );
        }
      );

      const docs = await service.loadPrefixed('summary-');

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
      expect(docs).toEqual([
        { source: 'notifications', metrics: { unread: 2 } },
        { source: 'office-time', metrics: { officedays: 12 } },
      ]);
    });

    it('initializes the storage backend before reading', async () => {
      await service.loadPrefixed('summary-');

      expect(mockStorage.create).toHaveBeenCalled();
    });
  });

  describe('bootstrap', () => {
    it('initializes the storage backend without reading anything', async () => {
      await service.bootstrap();

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
      expect(mockStorage.forEach).not.toHaveBeenCalled();
    });

    it('initializes the storage backend only once across bootstrap + load', async () => {
      await service.bootstrap();
      await service.load('tracking');

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('load', () => {
    it('reads a single slice by its plain "npc-" prefixed key', async () => {
      const value = { items: [] };
      mockStorage.get.mockResolvedValue(value);

      await expect(service.load('tracking')).resolves.toBe(value);
      expect(mockStorage.get).toHaveBeenCalledWith('npc-tracking');
    });

    it('initializes the storage backend before reading', async () => {
      await service.load('cash');

      expect(mockStorage.create).toHaveBeenCalled();
    });
  });

  describe('schema version (fresh-baseline wipe)', () => {
    it('wipes the store once and stamps VERSION when the persisted version is stale', async () => {
      mockStorage.get.mockImplementation(async (key: string) =>
        key === 'npc-schema-version' ? '1' : null
      );

      await service.bootstrap();

      expect(mockStorage.clear).toHaveBeenCalledTimes(1);
      expect(mockStorage.set).toHaveBeenCalledWith(
        'npc-schema-version',
        VERSION
      );
    });

    it('does not wipe when the persisted version already matches', async () => {
      // The default mock returns VERSION for the schema key.
      await service.bootstrap();

      expect(mockStorage.clear).not.toHaveBeenCalled();
    });
  });
});
