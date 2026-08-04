import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
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
  checkmarkCircle,
  chevronDown,
  chevronUp,
  notificationsOffOutline,
  notificationsOutline,
  pauseCircle,
  playCircle,
  stopCircle,
  trashOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { NotificationService, NotificationsFacade } from '../../data';
import { InboxNotification } from '../../../@shared/model/notifications.types';

@Component({
  selector: 'app-page-notifications',
  templateUrl: 'notifications.page.html',
  styleUrls: ['notifications.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  readonly #osNotifications = inject(NotificationService);

  readonly openNotifications = this.#facade.openNotifications;
  readonly doneNotifications = this.#facade.doneNotifications;
  readonly doneCollapsed = this.#facade.doneCollapsed;
  readonly isDev = isDevMode();

  ionViewWillEnter(): void {
    this.#facade.markPageViewed();
  }

  constructor() {
    addIcons({
      'chevron-down': chevronDown,
      'chevron-up': chevronUp,
      'checkmark-circle': checkmarkCircle,
      'pause-circle': pauseCircle,
      'play-circle': playCircle,
      'stop-circle': stopCircle,
      'trash-outline': trashOutline,
      'notifications-off-outline': notificationsOffOutline,
      notificationsOutline,
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

  fireTestOsNotification() {
    void this.#osNotifications.fireTestNotification();
  }

  addDebugNotification() {
    this.#facade.addDebugNotification();
  }
}
