/* ─── why ─────────────────────────────────────────────────────────
 * The drawer badges off `DECK_CATALOG`'s own `source`/`metric` pair, like
 * the grid does — it used to hardcode `notifications`, so the surface you
 * reach from INSIDE a page told you least.
 *
 * Currency entries are the exception: cash reports a balance, not a count,
 * and a number in an `ion-badge` beside a nav row reads as "things waiting
 * for you". A deck tile has room to render money; a drawer row does not.
 *
 * This is the menu's CONTENT, not the `ion-menu`: `ion-split-pane` styles
 * only its direct children, so the menu itself stays in the root template.
 * ───────────────────────────────────────────────────────────────── */
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuToggle,
  IonRouterLink,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { APP_WORDMARK } from '../../../@shared/model/app.consts';
import { DashboardFacade, DeckFacade } from '../../../commlink/data';
import { DECK_ICONS } from '../../../commlink/model/deck.icons';
import { DeckProgram } from '../../../commlink/model/deck.types';
import { badgeValue } from '../../../commlink/util/deck.utils';

@Component({
  selector: 'app-drawer-menu',
  templateUrl: 'drawer-menu.component.html',
  styleUrl: 'drawer-menu.component.scss',
  imports: [
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenuToggle,
    IonRouterLink,
    IonTitle,
    IonToolbar,
    RouterLink,
    TranslatePipe,
  ],
})
export class DrawerMenuComponent {
  readonly #telemetry = inject(DashboardFacade).dashboardState;

  protected readonly wordmark = APP_WORDMARK;
  readonly menuEntries = inject(DeckFacade).menuEntries;

  constructor() {
    addIcons(DECK_ICONS);
  }

  menuBadge(entry: DeckProgram): number {
    return entry.currency ? 0 : (badgeValue(this.#telemetry(), entry) ?? 0);
  }

  menuBadgeColor(entry: DeckProgram): string {
    return entry.source === 'notifications' ? 'danger' : 'medium';
  }
}
