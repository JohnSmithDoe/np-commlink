import { registerLocaleData } from '@angular/common';
import de from '@angular/common/locales/de';
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
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barcodeOutline,
  businessOutline,
  cartOutline,
  checkboxOutline,
  diceOutline,
  fileTrayStackedOutline,
  hardwareChipOutline,
  notificationsOutline,
  optionsOutline,
  pricetagsOutline,
  restaurantOutline,
  settingsOutline,
  sparklesOutline,
  timerOutline,
  walletOutline,
} from 'ionicons/icons';
import { DashboardFacade, DeckFacade } from './commlink/data';
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
    RouterLink,
    IonMenuToggle,
    TranslateModule,
  ],
})
export class AppComponent {
  readonly #dashboard = inject(DashboardFacade);
  readonly #deck = inject(DeckFacade);

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

  constructor() {
    registerLocaleData(de);
    addIcons({
      hardwareChipOutline,
      sparklesOutline,
      restaurantOutline,
      timerOutline,
      businessOutline,
      notificationsOutline,
      barcodeOutline,
      cartOutline,
      fileTrayStackedOutline,
      checkboxOutline,
      pricetagsOutline,
      optionsOutline,
      walletOutline,
      diceOutline,
      settingsOutline,
    });
  }
}
