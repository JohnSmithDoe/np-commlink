import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { COMMON_TEST_PROVIDERS } from '../testing/test-providers';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockStorage: {
    create: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    forEach: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStorage = {
      create: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
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
  });

  describe('saveSummary', () => {
    it('persists metrics only under "npc-summary-<source>"', async () => {
      await service.saveSummary('office-time', { officedays: 12 });

      expect(mockStorage.set).toHaveBeenCalledWith('npc-summary-office-time', {
        source: 'office-time',
        metrics: { officedays: 12 },
      });
    });

    it('initializes the storage backend before writing (guards the boot race)', async () => {
      await service.saveSummary('office-time', { officedays: 12 });

      expect(mockStorage.create).toHaveBeenCalled();
    });
  });

  describe('bootstrap', () => {
    it('initializes storage and returns only the npc-summary-* docs', async () => {
      mockStorage.forEach.mockImplementation(
        async (cb: (v: unknown, k: string, i: number) => void) => {
          cb(
            { source: 'notifications', metrics: { unread: 2 } },
            'npc-summary-notifications',
            0
          );
          cb({ items: [] }, 'npc-tracking', 1);
          cb(
            { source: 'office-time', metrics: { officedays: 12 } },
            'npc-summary-office-time',
            2
          );
        }
      );

      const { summaries } = await service.bootstrap();

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
      expect(summaries).toEqual([
        { source: 'notifications', metrics: { unread: 2 } },
        { source: 'office-time', metrics: { officedays: 12 } },
      ]);
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
});
