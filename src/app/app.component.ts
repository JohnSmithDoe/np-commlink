/* ─── why ─────────────────────────────────────────────────────────
 * The drawer badges off `DECK_CATALOG`'s own `source`/`metric` pair, like
 * the grid does — it used to hardcode `notifications`, so the surface you
 * reach from INSIDE a page told you least.
 *
 * Currency entries are the exception: cash reports a balance, not a count,
 * and a number in an `ion-badge` beside a nav row reads as "things waiting
 * for you". A deck tile has room to render money; a drawer row does not.
 *
 * `navigating` exists because a route change is not instant and nothing
 * said so. Every persisted context resolves through
 * `moduleHydrationResolver`, which awaits `loaded` before activating, so a
 * deep link sits on the previous screen for as long as the read takes. One
 * bar at the shell covers every such route, so no page solves it alone.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
} from '@angular/router';
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
  IonProgressBar,
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
import { AppUpdateService } from './@shared/data/service-worker/app-update.service';
import { DashboardFacade, DeckFacade } from './commlink/data';
import { DECK_ICONS } from './commlink/model/deck.icons';
import { DeckProgram } from './commlink/model/deck.types';
import { badgeValue } from './commlink/util/deck.utils';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
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
    IonProgressBar,
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

  readonly #navigating = signal(false);
  readonly navigating = this.#navigating.asReadonly();

  readonly menuEntries = this.#deck.menuEntries;

  readonly #telemetry = this.#dashboard.dashboardState;

  menuBadge(entry: DeckProgram): number {
    if (entry.currency) return 0;
    return badgeValue(this.#telemetry(), entry) ?? 0;
  }

  menuBadgeColor(entry: DeckProgram): string {
    return entry.source === 'notifications' ? 'danger' : 'medium';
  }

  readonly updateReady = this.#update.updateReady;

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
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => this.#trackNavigation(event));
  }

  #trackNavigation(event: RouterEvent): void {
    if (event instanceof NavigationStart) this.#navigating.set(true);
    if (
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    ) {
      this.#navigating.set(false);
    }
  }
}
