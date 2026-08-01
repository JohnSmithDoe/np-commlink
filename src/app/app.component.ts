import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonApp,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterLink,
  IonRouterOutlet,
  IonTitle,
  IonToast,
  IonToolbar,
  ToastButton,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { APP_WORDMARK } from './@shared/model/app.consts';
import { AppUpdateService } from './@shared/util/service-worker/app-update.service';
import { DashboardFacade, DeckFacade } from './commlink/data';
import { DECK_ICONS } from './commlink/model/deck.icons';
import { IDeckProgram } from './commlink/model/deck.types';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonApp,
    IonRouterOutlet,
    IonRouterLink,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonToast,
    RouterLink,
    IonMenuToggle,
    TranslatePipe,
  ],
})
export class AppComponent {
  protected readonly wordmark = APP_WORDMARK;
  readonly #dashboard = inject(DashboardFacade);
  readonly #deck = inject(DeckFacade);
  readonly #update = inject(AppUpdateService);

  /**
   * The menu is one of two renderings of the user's deck configuration (the
   * grid is the other), so the shell holds no list of its own.
   */
  readonly menuEntries = this.#deck.menuEntries;

  // Reads the eager dashboard read-model, not the notifications slice — the
  // shell must not depend on a lazy domain slice.
  readonly #notificationsUnread = this.#dashboard.notificationsUnread;

  /**
   * Only the inbox row badges. Its count is always-on shell chrome the
   * read-model already carries; every other row's metric is a deck-tile
   * concern, and a menu of thirteen counters reads as noise.
   */
  menuBadge(entry: IDeckProgram): number {
    return entry.source === 'notifications' ? this.#notificationsUnread() : 0;
  }

  readonly updateReady = this.#update.updateReady;

  /**
   * Built here rather than in the service because `ion-toast` takes its buttons
   * as a property — there is no slot to project a `| translate` into — and the
   * labels are the template's business, which is what keeps `TranslateService`
   * out of the shell entirely.
   */
  updateActions(reload: string, later: string): ToastButton[] {
    return [
      { text: reload, role: 'destructive', handler: () => this.applyUpdate() },
      { text: later, role: 'cancel' },
    ];
  }

  applyUpdate(): void {
    this.#update.applyUpdate();
  }

  dismissUpdate(): void {
    this.#update.dismiss();
  }

  constructor() {
    addIcons(DECK_ICONS);
  }
}
