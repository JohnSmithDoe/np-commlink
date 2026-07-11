import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  add,
  barcodeOutline,
  businessOutline,
  documentsOutline,
  notificationsOutline,
  settingsOutline,
  timerOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  imports: [
    IonToolbar,
    IonHeader,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    TranslateModule,
  ],
})
export class PageHeaderComponent {
  readonly label = input('');
  // ionicon name shown before the (lowercased) title — the deck brand look
  // established on /commlink and /soykaf.
  readonly icon = input<string>();
  readonly hideButtons = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly addItem = output<void>();

  constructor() {
    addIcons({
      add,
      businessOutline,
      settingsOutline,
      documentsOutline,
      barcodeOutline,
      notificationsOutline,
      timerOutline,
    });
  }
}
