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
import { TranslatePipe } from '@ngx-translate/core';
import { TColor } from '../../model/app.types';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  imports: [
    IonToolbar,
    IonHeader,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    TranslatePipe,
  ],
})
export class PageHeaderComponent {
  readonly label = input('');
  // ionicon name shown before the (lowercased) title — the deck brand look
  // established on /commlink and /soykaf.
  readonly icon = input<string>();
  // Optional toolbar tint used by the grocery pages (slate per-domain color).
  readonly color = input<TColor>();
  readonly hideButtons = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly addItem = output<void>();

  constructor() {
    // Only the icon this template renders itself. The `[icon]` input is a
    // string from the page, and each page registers the icon it passes — a
    // domain-blind header must not carry a roster of domain icons.
    addIcons({ add });
  }
}
