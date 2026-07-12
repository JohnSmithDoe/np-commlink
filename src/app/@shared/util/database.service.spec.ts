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
  };

  beforeEach(() => {
    mockStorage = {
      create: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
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

  describe('create', () => {
    it('initializes storage and loads every slice (timetracker + grocery) with the "npc-" prefix', async () => {
      await expect(service.create()).resolves.toBeTruthy();

      expect(mockStorage.create).toHaveBeenCalledTimes(1);
      // timetracker slices
      expect(mockStorage.get).toHaveBeenCalledWith('npc-tracking');
      expect(mockStorage.get).toHaveBeenCalledWith('npc-officeTime');
      expect(mockStorage.get).toHaveBeenCalledWith('npc-notifications');
      // grocery slices
      expect(mockStorage.get).toHaveBeenCalledWith('npc-globals');
      expect(mockStorage.get).toHaveBeenCalledWith('npc-shopping');
      expect(mockStorage.get).toHaveBeenCalledWith('npc-storage');
      expect(mockStorage.get).toHaveBeenCalledWith('npc-tasks');
      expect(mockStorage.get).toHaveBeenCalledWith('npc-listSettings');
    });
  });
});
