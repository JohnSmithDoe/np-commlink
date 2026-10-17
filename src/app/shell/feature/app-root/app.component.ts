/* ─── why ─────────────────────────────────────────────────────────
 * `navigating` exists because a route change is not instant and nothing
 * said so. Every persisted context resolves through
 * `moduleHydrationResolver`, which awaits `loaded` before activating, so a
 * deep link sits on the previous screen for as long as the read takes. One
 * bar at the shell covers every such route, so no page solves it alone.
 * ───────────────────────────────────────────────────────────────── */

import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import {
  IonApp,
  IonMenu,
  IonProgressBar,
  IonRouterOutlet,
  IonSplitPane,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ItemDialogService } from '../../../@shared/data/item-lists/item-dialog.service';
import { EditPersonDialogComponent } from '../../../people/feature/edit-person-dialog/edit-person-dialog.component';
import { PEOPLE_LIST_ID } from '../../../people/model/people.types';
import { ErrorFallbackComponent } from '../../../@shared/ui/error-fallback/error-fallback.component';
import { DrawerMenuComponent } from '../../smart-ui/drawer-menu/drawer-menu.component';
import { UpdateToastComponent } from '../../smart-ui/update-toast/update-toast.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  imports: [
    DrawerMenuComponent,
    EditPersonDialogComponent,
    ErrorFallbackComponent,
    IonApp,
    IonMenu,
    IonProgressBar,
    IonRouterOutlet,
    IonSplitPane,
    TranslatePipe,
    UpdateToastComponent,
  ],
})
export class AppComponent {
  readonly #navigating = signal(false);
  readonly #dialogs = inject(ItemDialogService);

  readonly navigating = this.#navigating.asReadonly();
  readonly personDialogRequested = computed(
    () => this.#dialogs.request()?.listId === PEOPLE_LIST_ID
  );

  constructor() {
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
