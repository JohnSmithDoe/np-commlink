import {
  ChangeDetectionStrategy,
  Component,
  inject,
  isDevMode,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, flask, remove, save, settingsSharp, trash } from 'ionicons/icons';
import { ITrackingItem } from '../../model';
import { LIST_FACADE } from '../../../@shared/util/list/list-page.facade';
import { ListPageComponent } from '../../../@shared/feature/list-page/list-page.component';
import { TrackingListPageFacade } from '../../data';
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
  readonly #facade = inject(TrackingListPageFacade);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly total = this.#facade.total;
  readonly isDev = isDevMode();

  constructor() {
    addIcons({ add, flask, remove, save, settingsSharp, trash });
  }

  ionViewWillEnter(): void {
    this.#facade.enterPage();
    this.#applyNotificationCommand();
  }

  // A notification CTA on /notifications deep-links here with ?cmd=<id>. The
  // route resolver has already hydrated tracking, so we dispatch the command
  // and immediately strip the param (replaceUrl) so a reload/re-enter can't
  // re-fire the toggle.
  #applyNotificationCommand(): void {
    const cmd = this.#route.snapshot.queryParamMap.get('cmd');
    if (!cmd) return;
    this.#facade.applyNotificationCommand(cmd);
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  removeItem(item: ITrackingItem) {
    this.#facade.removeItem(item);
  }

  showEditDialog(item: ITrackingItem) {
    this.#facade.showEditDialog(item);
  }

  toggleTracking(item: ITrackingItem) {
    this.#facade.toggleTracking(item);
  }

  resetAll() {
    this.#facade.resetAll();
  }
  resetItem(item: ITrackingItem) {
    this.#facade.resetItem(item);
  }

  saveAndResetAll() {
    this.#facade.saveAndReset();
  }

  generateDummyData() {
    this.#facade.generateDummyData();
  }

  protected generateTaskByTicket() {
    this.#facade.createByTicket();
  }
}
