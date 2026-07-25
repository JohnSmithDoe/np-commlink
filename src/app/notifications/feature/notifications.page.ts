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
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  chevronDown,
  chevronUp,
  notificationsOffOutline,
  pauseCircle,
  playCircle,
  stopCircle,
  trashOutline,
} from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { PageHeaderComponent } from '../../@shared/ui/page-header/page-header.component';
import { INotification } from '../../@shared/model/types';
import { NotificationService } from '../util/notification.service';
import { NotificationsFacade } from '../data';

marker('notifications.action.start');
marker('notifications.action.stop');
marker('notifications.action.pause');

@Component({
  selector: 'app-page-notifications',
  templateUrl: 'notifications.page.html',
  styleUrls: ['notifications.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
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
    });
  }

  trackById(_: number, n: INotification) {
    return n.id;
  }

  triggerAction(n: INotification, event: Event) {
    event.stopPropagation();
    // The action targets the tracking aggregate, which is lazy and not
    // registered here. Deep-link to /tracking; it activates (hydrates) and
    // applies its own command (see TrackingNotificationsEffects
    // .applyNotificationCommand$ — lazy-modules §7). Notifications stays
    // dependency-free: a string route, no tracking import.
    void this.#router.navigate(['/tracking'], { queryParams: { cmd: n.id } });
  }

  markDone(n: INotification, event: Event) {
    event.stopPropagation();
    this.#facade.markDone(n.id);
  }

  remove(n: INotification, event: Event) {
    event.stopPropagation();
    this.#facade.removeNotification(n.id);
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

  actionLabelKey(n: INotification): string {
    switch (n.action?.type) {
      case 'tracking.start': {
        return 'notifications.action.start';
      }
      case 'tracking.stop': {
        return 'notifications.action.stop';
      }
      case 'tracking.pause': {
        return 'notifications.action.pause';
      }
      default: {
        return '';
      }
    }
  }
}
