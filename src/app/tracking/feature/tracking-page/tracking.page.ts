import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, flask, remove, save, trash } from 'ionicons/icons';
import {
  IonViewWillEnter,
  ITrackingItem,
  TItemListSortType,
} from '../../../@shared/types';
import { ListPageComponent } from '../../smart-ui/list-page/list-page.component';
import {
  DialogsActions,
  TrackingActions,
  selectTrackingTime,
} from '../../data';
import { DailySessionsComponent } from '../../smart-ui/daily-sessions/daily-sessions.component';

import { IonButton, IonIcon } from '@ionic/angular/standalone';
import dayjs from 'dayjs';
import { TrackingItemComponent } from '../../ui/tracking-item/tracking-item.component';
import { EditTrackingItemDialogComponent } from '../edit-tracking-item-dialog/edit-tracking-item-dialog.component';

@Component({
  selector: 'app-tracking-page',
  templateUrl: 'tracking.page.html',
  styleUrls: ['tracking.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ListPageComponent,
    DailySessionsComponent,
    IonButton,
    IonIcon,
    TrackingItemComponent,
    EditTrackingItemDialogComponent,
  ],
})
export class TrackingPage implements IonViewWillEnter {
  readonly #store = inject(Store);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly isDev = isDevMode();

  constructor() {
    addIcons({ add, flask, remove, save, trash });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(TrackingActions.enterPage());
    this.#applyNotificationCommand();
  }

  // A notification CTA on /notifications deep-links here with ?cmd=<id>. The
  // route resolver has already hydrated tracking, so we dispatch the command
  // and immediately strip the param (replaceUrl) so a reload/re-enter can't
  // re-fire the toggle.
  #applyNotificationCommand(): void {
    const cmd = this.#route.snapshot.queryParamMap.get('cmd');
    if (!cmd) return;
    this.#store.dispatch(TrackingActions.applyNotificationCommand(cmd));
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  removeItem(item: ITrackingItem) {
    this.#store.dispatch(TrackingActions.removeItem(item));
  }

  showEditDialog(item: ITrackingItem) {
    this.#store.dispatch(DialogsActions.showEditDialog(item));
  }

  setSortMode(type: TItemListSortType) {
    this.#store.dispatch(TrackingActions.updateSort(type, 'toggle'));
  }

  toggleTracking(item: ITrackingItem) {
    this.#store.dispatch(
      TrackingActions.toggleTrackingItem(item, dayjs().format())
    );
  }

  resetAll() {
    this.#store.dispatch(TrackingActions.resetAllTracking());
  }
  resetItem(item: ITrackingItem) {
    this.#store.dispatch(TrackingActions.resetTracking(item));
  }

  saveAndResetAll() {
    this.#store.dispatch(TrackingActions.saveAndResetTracking());
  }

  generateDummyData() {
    this.#store.dispatch(TrackingActions.generateDummyData());
  }

  protected generateTaskByTicket() {
    this.#store.dispatch(DialogsActions.showCreateByTicketDialog());
  }
}
