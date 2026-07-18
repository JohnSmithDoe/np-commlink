import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { COMMON_TEST_PROVIDERS } from '../testing/test-providers';
import { mockBaseItem } from '../testing/test-data';
import { UiService } from './ui.service';

describe('UiService', () => {
  let service: UiService;
  let toast: { present: ReturnType<typeof vi.fn> };
  let toastController: { create: ReturnType<typeof vi.fn> };
  let instantSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    toast = { present: vi.fn().mockResolvedValue(undefined) };
    toastController = { create: vi.fn().mockResolvedValue(toast) };

    TestBed.configureTestingModule({
      providers: [
        ...COMMON_TEST_PROVIDERS,
        { provide: ToastController, useValue: toastController },
      ],
    });
    service = TestBed.inject(UiService);
    // `instant` returns the key when no translations are loaded; spy to assert args.
    instantSpy = vi.spyOn(TestBed.inject(TranslateService), 'instant');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showToast', () => {
    it('creates and presents a toast with the given message and color', async () => {
      await service.showToast('hi', 'warning');

      expect(toastController.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'hi', color: 'warning' })
      );
      expect(toast.present).toHaveBeenCalledTimes(1);
    });

    it('defaults the color to "success"', async () => {
      await service.showToast('hi');

      expect(toastController.create).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'hi', color: 'success' })
      );
    });
  });

  describe('showAddItemToast', () => {
    it('translates with the item name and presents a success toast', async () => {
      await service.showAddItemToast('Bananas');

      expect(instantSpy).toHaveBeenCalledWith('toast.add.item', {
        name: 'Bananas',
      });
      expect(toastController.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' })
      );
      expect(toast.present).toHaveBeenCalledTimes(1);
    });
  });

  describe('showRemoveItemToast', () => {
    it('uses the "warning" color', async () => {
      await service.showRemoveItemToast('Bananas');

      expect(instantSpy).toHaveBeenCalledWith('toast.remove.item', {
        name: 'Bananas',
      });
      expect(toastController.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'warning' })
      );
    });
  });

  describe('showItemContainedToast', () => {
    it('uses the "medium" color', async () => {
      await service.showItemContainedToast('Bananas');

      expect(instantSpy).toHaveBeenCalledWith('toast.add.item.failure', {
        name: 'Bananas',
      });
      expect(toastController.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'medium' })
      );
    });
  });

  describe('showUpdateItemToast', () => {
    it('translates with the item name and presents a toast', async () => {
      await service.showUpdateItemToast(mockBaseItem({ name: 'Milk' }));

      expect(instantSpy).toHaveBeenCalledWith('toast.update.item', {
        name: 'Milk',
      });
      expect(toast.present).toHaveBeenCalledTimes(1);
    });
  });
});
