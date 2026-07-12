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
import { DialogsActions } from '../../data/dialogs/dialogs.actions';
import { TrackingActions } from '../../data/tracking.actions';
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
    this.#store.dispatch(TrackingActions.enterPage());
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
