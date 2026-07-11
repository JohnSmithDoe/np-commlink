import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
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
import { dialogsActions } from '../../data/dialogs/dialogs.actions';
import { trackingActions } from '../../data/tracking.actions';
import { DailySessionsComponent } from '../../smart-ui/daily-sessions/daily-sessions.component';

import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { selectTrackingTime } from '../../data/tracking.selector';
import dayjs from 'dayjs';
import { TrackingItemComponent } from '../../ui/tracking-item/tracking-item.component';
import { EditTrackingItemDialogComponent } from '../../smart-ui/edit-tracking-item-dialog/edit-tracking-item-dialog.component';

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

  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly isDev = isDevMode();

  constructor() {
    addIcons({ add, flask, remove, save, trash });
  }

  ionViewWillEnter(): void {
    this.#store.dispatch(trackingActions.enterPage());
  }

  removeItem(item: ITrackingItem) {
    this.#store.dispatch(trackingActions.removeItem(item));
  }

  showEditDialog(item: ITrackingItem) {
    this.#store.dispatch(dialogsActions.showEditDialog(item));
  }

  setSortMode(type: TItemListSortType) {
    this.#store.dispatch(trackingActions.updateSort(type, 'toggle'));
  }

  toggleTracking(item: ITrackingItem) {
    this.#store.dispatch(
      trackingActions.toggleTrackingItem(item, dayjs().format())
    );
  }

  resetAll() {
    this.#store.dispatch(trackingActions.resetAllTracking());
  }
  resetItem(item: ITrackingItem) {
    this.#store.dispatch(trackingActions.resetTracking(item));
  }

  saveAndResetAll() {
    this.#store.dispatch(trackingActions.saveAndResetTracking());
  }

  generateDummyData() {
    this.#store.dispatch(trackingActions.generateDummyData());
  }

  protected generateTaskByTicket() {
    this.#store.dispatch(dialogsActions.showCreateByTicketDialog());
  }
}
