import { Component, inject } from '@angular/core';
import { IonToast, ToastButton } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AppUpdateService } from '../../../@shared/data/service-worker/app-update.service';

@Component({
  selector: 'app-update-toast',
  templateUrl: 'update-toast.component.html',
  imports: [IonToast, TranslatePipe],
})
export class UpdateToastComponent {
  readonly #update = inject(AppUpdateService);

  readonly updateReady = this.#update.updateReady;

  updateActions(reload: string, later: string): ToastButton[] {
    return [
      { text: reload, role: 'destructive', handler: () => this.applyUpdate() },
      { text: later, role: 'cancel' },
    ];
  }

  applyUpdate(): void {
    this.#update.applyUpdate();
  }

  dismissUpdate(): void {
    this.#update.dismiss();
  }
}
