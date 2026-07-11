import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
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
import { INotification, IonViewWillEnter } from '../../@shared/types';
import { NotificationService } from '../util/notification.service';
import { notificationsActions } from '../data/notifications.actions';
import {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectNewNotifications,
} from '../data/notifications.selectors';

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
export class NotificationsPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #osNotifications = inject(NotificationService);

  readonly newNotifications = this.#store.selectSignal(selectNewNotifications);
  readonly doneNotifications = this.#store.selectSignal(
    selectDoneNotifications
  );
  readonly doneCollapsed = this.#store.selectSignal(selectDoneCollapsed);

  ionViewWillEnter(): void {
    this.#store.dispatch(notificationsActions.markPageViewed());
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
    this.#store.dispatch(notificationsActions.triggerAction(n.id));
  }

  markDone(n: INotification, event: Event) {
    event.stopPropagation();
    this.#store.dispatch(notificationsActions.markDone(n.id));
  }

  remove(n: INotification, event: Event) {
    event.stopPropagation();
    this.#store.dispatch(notificationsActions.removeNotification(n.id));
  }

  toggleDoneSection() {
    this.#store.dispatch(notificationsActions.toggleDoneSection());
  }

  clearDone() {
    this.#store.dispatch(notificationsActions.clearDone());
  }

  fireTestOsNotification() {
    void this.#osNotifications.fireTestNotification();
  }

  addDebugNotification() {
    this.#store.dispatch(notificationsActions.addDebugNotification());
  }

  actionLabelKey(n: INotification): string {
    switch (n.action?.type) {
      case 'tracking.start':
        return 'notifications.action.start';
      case 'tracking.stop':
        return 'notifications.action.stop';
      case 'tracking.pause':
        return 'notifications.action.pause';
      default:
        return '';
    }
  }
}
