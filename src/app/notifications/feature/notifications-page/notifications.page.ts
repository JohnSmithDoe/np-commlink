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
import { NotificationService } from '../../util/notification.service';
import { NotificationsFacade } from '../../data';
import { INotification } from '../../../@shared/model/notifications.types';

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

  readonly newNotifications = this.#facade.newNotifications;
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

  triggerAction(n: INotification, event: Event) {
    event.stopPropagation();
    if (!n.action) return;
    // The action targets the tracking aggregate, which is lazy and not
    // registered here. Deep-link to /tracking; it activates (hydrates) and
    // applies its own command (see TrackingNotificationsEffects
    // .applyNotificationCommand$). Notifications stays dependency-free: a
    // string route, no tracking import. The command travels in the link rather
    // than the row's id, so the producer resolves it without reading the inbox
    // back.
    void this.#router.navigate(['/tracking'], {
      queryParams: { cmd: n.action.type, target: n.action.targetId },
    });
  }

  markDone(n: INotification, event: Event) {
    event.stopPropagation();
    this.#facade.dismiss(n.id);
  }

  remove(n: INotification, event: Event) {
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
