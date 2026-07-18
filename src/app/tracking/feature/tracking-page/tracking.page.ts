import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, flask, remove, save, settingsSharp, trash } from 'ionicons/icons';
import { ITrackingItem } from '../../model';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import {
  TrackingActions,
  TrackingListPageFacade,
  selectTrackingTime,
} from '../../data';
import { DailySessionsComponent } from '../../smart-ui/daily-sessions/daily-sessions.component';

import {
  IonButton,
  IonIcon,
  IonRouterLink,
  ViewWillEnter,
} from '@ionic/angular/standalone';
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
    IonRouterLink,
    RouterLink,
    TrackingItemComponent,
    EditTrackingItemDialogComponent,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: TrackingListPageFacade }],
})
export class TrackingPage implements ViewWillEnter {
  readonly #store = inject(Store);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly isDev = isDevMode();

  constructor() {
    addIcons({ add, flask, remove, save, settingsSharp, trash });
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
    this.#store.dispatch(ItemDialogsActions.showEditDialog(item, '_tracking'));
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
    this.#store.dispatch(TrackingActions.showCreateByTicket());
  }
}
