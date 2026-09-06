/* ─── why ─────────────────────────────────────────────────────────
 * Mount this on a module's EMPTY-PATH route. `IonTabs` navigates to
 * `<its own URL>/<tab>`, so an empty path leaves the prefix at `/trackplay`
 * and the tab routes keep the addresses the catalog already publishes.
 * Giving the route a path would push a segment into every URL beneath it,
 * with nothing failing at compile time.
 *
 * The bar is read from the catalog, never from a list the module keeps:
 * adding a program is one catalog entry, and a page one segment deeper is a
 * stack inside its tab rather than a fourth tab.
 * ───────────────────────────────────────────────────────────────── */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PROGRAM_CONTEXT } from '../../util/program-context.token';
import { routeUrl } from '../../util/route-url';

@Component({
  selector: 'app-page-module-tabs',
  templateUrl: './module-tabs.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, TranslatePipe],
})
export class ModuleTabsPage {
  protected readonly tabs = inject(PROGRAM_CONTEXT)(
    routeUrl(inject(ActivatedRoute))
  ).siblings;
}
