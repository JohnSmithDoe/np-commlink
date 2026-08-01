import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  add,
  flask,
  remove,
  save,
  settingsSharp,
  timerOutline,
  trash,
} from 'ionicons/icons';
import { ITrackingItem } from '../../model/tracking.types';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { TrackingFacade, TrackingListPageFacade } from '../../data';
import { DailySessionsComponent } from '../../smart-ui/daily-sessions/daily-sessions.component';

import {
  IonButton,
  IonIcon,
  IonRouterLink,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TrackingItemComponent } from '../../ui/tracking-item/tracking-item.component';
import { EditTrackingItemDialogComponent } from '../edit-tracking-item-dialog/edit-tracking-item-dialog.component';

@Component({
  selector: 'app-page-tracking',
  templateUrl: 'tracking.page.html',
  styleUrls: ['tracking.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
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
  readonly #list = inject(TrackingListPageFacade);
  readonly #tracking = inject(TrackingFacade);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly total = this.#tracking.total;
  readonly isDev = isDevMode();

  constructor() {
    addIcons({ add, flask, remove, save, settingsSharp, trash, timerOutline });
  }

  ionViewWillEnter(): void {
    this.#applyNotificationCommand();
  }

  // A notification CTA on /notifications deep-links here with
  // ?cmd=<command>&target=<itemId>. The route resolver has already hydrated
  // tracking, so we dispatch the command and immediately strip the params
  // (replaceUrl) so a reload/re-enter can't re-fire the toggle.
  #applyNotificationCommand(): void {
    const queryParameters = this.#route.snapshot.queryParamMap;
    const cmd = queryParameters.get('cmd');
    const target = queryParameters.get('target');
    if (!cmd || !target) return;
    this.#tracking.applyNotificationCommand(cmd, target);
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  removeItem(item: ITrackingItem) {
    this.#list.removeItem(item);
  }

  showEditDialog(item: ITrackingItem) {
    this.#list.showEditDialog(item);
  }

  toggleTracking(item: ITrackingItem) {
    this.#tracking.toggleTracking(item);
  }

  resetAll() {
    this.#tracking.resetAll();
  }
  resetItem(item: ITrackingItem) {
    this.#tracking.resetItem(item);
  }

  saveAndResetAll() {
    this.#tracking.saveAndReset();
  }

  seedDemoSessions() {
    this.#tracking.seedDemoSessions();
  }

  protected generateTaskByTicket() {
    this.#list.createByTicket();
  }
}
