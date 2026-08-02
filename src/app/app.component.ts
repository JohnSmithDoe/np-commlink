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
import { DeckProgram } from './commlink/model/deck.types';

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

  readonly menuEntries = this.#deck.menuEntries;

  readonly #notificationsUnread = this.#dashboard.notificationsUnread;

  menuBadge(entry: DeckProgram): number {
    return entry.source === 'notifications' ? this.#notificationsUnread() : 0;
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
  }
}
