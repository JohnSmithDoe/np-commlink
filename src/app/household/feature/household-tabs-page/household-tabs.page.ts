/* ─── why ─────────────────────────────────────────────────────────
 * This shell replaces an `ion-segment` that bound its value to the route and
 * had to guard the navigation it echoed back. `ion-tab-bar` reads the router
 * itself, so the guard has nothing left to do.
 *
 * Its route is PATHLESS on purpose. `IonTabs` navigates to
 * `tabsPrefix/<tab>`, and `tabsPrefix` is this route's own URL — an empty
 * path contributes no segment, so the prefix stays `/household` and
 * `/household/shopping` survives verbatim. Every deck catalog route and
 * `ROUTE_BY_LIST_ID` entry points there; pathing this parent would break
 * all six at once, with nothing failing at compile time.
 *
 * `list-settings` and `categories/:listId` are siblings, not children: a
 * sub-page hides the bar, and Ionic would otherwise read either as a fourth
 * tab stack.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  cartOutline,
  fileTrayStackedOutline,
  pricetagsOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-page-household-tabs',
  templateUrl: 'household-tabs.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, TranslatePipe],
})
export class HouseholdTabsPage {
  constructor() {
    addIcons({ cartOutline, fileTrayStackedOutline, pricetagsOutline });
  }
}
