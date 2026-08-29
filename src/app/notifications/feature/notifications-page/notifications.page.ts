import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  notificationsOffOutline,
  pauseCircleOutline,
  playCircleOutline,
  stopCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { NotificationsFacade } from '../../data';
import { InboxNotification } from '../../../@shared/model/notifications.types';

@Component({
  selector: 'app-page-notifications',
  templateUrl: 'notifications.page.html',
  styleUrls: ['notifications.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    PageHeaderComponent,
    TranslatePipe,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonButton,
    IonButtons,
  ],
})
export class NotificationsPage implements ViewWillEnter {
  readonly #facade = inject(NotificationsFacade);
  readonly #router = inject(Router);

  readonly openNotifications = this.#facade.openNotifications;
  readonly doneNotifications = this.#facade.doneNotifications;
  readonly doneCollapsed = this.#facade.doneCollapsed;

  ionViewWillEnter(): void {
    this.#facade.markPageViewed();
  }

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
      notificationsOffOutline,
      pauseCircleOutline,
      playCircleOutline,
      stopCircleOutline,
      trashOutline,
    });
  }

  triggerAction(n: InboxNotification, event: Event) {
    event.stopPropagation();
    if (!n.action) return;
    void this.#router.navigate(['/tracking'], {
      queryParams: { cmd: n.action.type, target: n.action.targetId },
    });
  }

  markDone(n: InboxNotification, event: Event) {
    event.stopPropagation();
    this.#facade.dismiss(n.id);
  }

  remove(n: InboxNotification, event: Event) {
    event.stopPropagation();
    this.#facade.remove(n.id);
  }

  toggleDoneSection() {
    this.#facade.toggleDoneSection();
  }

  clearDone() {
    this.#facade.clearDone();
  }
}
