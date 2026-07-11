import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ITrackingItem, TColor, TUpdateDTO } from '../types';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  readonly #toastController = inject(ToastController);
  readonly translate = inject(TranslateService);

  async showToast(message: string, color: TColor = 'success') {
    const toast = await this.#toastController.create({
      position: 'bottom',
      positionAnchor: 'footer',
      buttons: [
        {
          text: 'X',
          role: 'cancel',
        },
      ],
      duration: 1500,
      color,
      message,
    });
    await toast.present();
  }

  showSavedToast() {
    const msg = this.translate.instant(marker('toast.tracking.saved'));
    return this.showToast(msg);
  }

  showAddItemToast(name: string) {
    const msg = this.translate.instant(marker('toast.add.item'), { name });
    return this.showToast(msg);
  }

  showUpdateItemToast(item: TUpdateDTO<ITrackingItem>) {
    const msg = this.translate.instant(marker('toast.update.item'), {
      name: item.name,
    });
    return this.showToast(msg);
  }

  showRemoveItemToast(name: string) {
    const msg = this.translate.instant(marker('toast.remove.item'), { name });
    return this.showToast(msg, 'warning');
  }

  showItemContainedToast(name: string) {
    const msg = this.translate.instant(marker('toast.add.item.failure'), {
      name,
    });
    return this.showToast(msg, 'medium');
  }
}
