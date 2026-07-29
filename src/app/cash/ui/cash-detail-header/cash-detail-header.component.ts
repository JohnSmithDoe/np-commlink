import {
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

/**
 * DUMB toolbar for cash's four drill-down pages (ledger, rules, category, report):
 * back arrow, title, and whatever page-specific buttons the page projects into
 * `[toolbar]`. The shared `app-page-header` cannot serve these — it opens the side
 * menu where a detail page has to go back — so the back affordance and its a11y
 * label live here once instead of in four page templates.
 *
 * `heading` is already-resolved text: some pages show an entity's name, others a
 * `page-title.*` key they translate at the call site.
 */
@Component({
  selector: 'app-cash-detail-header',
  templateUrl: './cash-detail-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    TranslatePipe,
  ],
})
export class CashDetailHeaderComponent {
  readonly heading = input('');
  readonly back = output<void>();

  constructor() {
    addIcons({ arrowBackOutline });
  }
}
