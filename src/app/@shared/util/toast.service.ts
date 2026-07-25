import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IBaseItem, TColor, TUpdateDTO } from '../model/types';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
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
    const message = this.translate.instant(marker('toast.saved'));
    return this.showToast(message);
  }

  showAddItemToast(name: string) {
    const message = this.translate.instant(marker('toast.add.item'), { name });
    return this.showToast(message);
  }

  showUpdateItemToast(item: TUpdateDTO<IBaseItem>) {
    const message = this.translate.instant(marker('toast.update.item'), {
      name: item.name,
    });
    return this.showToast(message);
  }

  showRemoveItemToast(name: string) {
    const message = this.translate.instant(marker('toast.remove.item'), {
      name,
    });
    return this.showToast(message, 'warning');
  }

  showItemContainedToast(name: string) {
    const message = this.translate.instant(marker('toast.add.item.failure'), {
      name,
    });
    return this.showToast(message, 'medium');
  }
}
