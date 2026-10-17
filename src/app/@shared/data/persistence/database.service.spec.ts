import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { DatabaseService } from './database.service';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockStorage: {
    create: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    forEach: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  };

  const holdCreate = (): (() => void) => {
    let release!: () => void;
    mockStorage.create.mockReturnValue(
      new Promise<void>((resolve) => (release = resolve))
    );
    return () => release();
  };

  beforeEach(() => {
    mockStorage = {
      create: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      forEach: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
    };
    TestBed.configureTestingModule({
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: Storage, useValue: mockStorage },
      ],
    });
    service = TestBed.inject(DatabaseService);
  });

  describe('save', () => {
    it('persists under the unified "npc-" prefixed key', async () => {
      const value = { showQuickAdd: true } as never;

      await service.save('listSettings', value);

      expect(mockStorage.set).toHaveBeenCalledWith('npc-listSettings', value);
    });

    it('initializes the storage backend before writing', async () => {
      const release = holdCreate();
      const saving = service.save('listSettings', {
        showQuickAdd: true,
      } as never);
      await settle();

      expect(mockStorage.set).not.toHaveBeenCalled();

      release();
      await saving;

      expect(mockStorage.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadPrefixed', () => {
    it('returns only the documents whose key matches the "npc-<prefix>" family', async () => {
      const stored: Record<string, unknown> = {
        'npc-summary-notifications': {
          source: 'notifications',
          metrics: { unread: 2 },
        },
        'npc-tracking': { items: [] },
        'npc-summary-office-time': {
          source: 'office-time',
          metrics: { officedays: 12 },
        },
      };
      mockStorage.keys.mockResolvedValue(Object.keys(stored));
      mockStorage.get.mockImplementation(async (key: string) => stored[key]);

      const documents = await service.loadPrefixed('summary-');

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
      expect(documents).toEqual([
        { source: 'notifications', metrics: { unread: 2 } },
        { source: 'office-time', metrics: { officedays: 12 } },
      ]);
      expect(mockStorage.get).not.toHaveBeenCalledWith('npc-tracking');
    });

    it('initializes the storage backend before reading', async () => {
      const release = holdCreate();
      const loading = service.loadPrefixed('summary-');
      await settle();

      expect(mockStorage.keys).not.toHaveBeenCalled();

      release();
      await loading;

      expect(mockStorage.keys).toHaveBeenCalledTimes(1);
    });
  });

  describe('bootstrap', () => {
    it('initializes the storage backend without reading anything', async () => {
      await service.bootstrap();

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
      expect(mockStorage.forEach).not.toHaveBeenCalled();
      expect(mockStorage.keys).not.toHaveBeenCalled();
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
      const release = holdCreate();
      const loading = service.load('cash');
      await settle();

      expect(mockStorage.get).not.toHaveBeenCalled();

      release();
      await loading;

      expect(mockStorage.get).toHaveBeenCalledExactlyOnceWith('npc-cash');
    });
  });

  describe('bootstrap (no global wipe)', () => {
    it('never clears the store — schema evolution is per-domain (migrate-on-read)', async () => {
      await service.bootstrap();

      expect(mockStorage.clear).not.toHaveBeenCalled();
    });
  });
});
