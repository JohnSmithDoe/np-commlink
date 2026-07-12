import { registerLocaleData } from '@angular/common';
import de from '@angular/common/locales/de';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonApp,
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  barcodeOutline,
  businessOutline,
  cafeOutline,
  cartOutline,
  checkboxOutline,
  diceOutline,
  fileTrayStackedOutline,
  hardwareChipOutline,
  notificationsOutline,
  optionsOutline,
  pricetagsOutline,
  timerOutline,
  walletOutline,
} from 'ionicons/icons';
import { selectNotificationsBadgeCount } from './notifications/data/notifications.selector';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
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
  readonly #store = inject(Store);
  readonly notificationsBadge = this.#store.selectSignal(
    selectNotificationsBadgeCount
  );

  constructor() {
    registerLocaleData(de);
    addIcons({
      hardwareChipOutline,
      cafeOutline,
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
    });
  }
}
