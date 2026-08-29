/* ─── why ─────────────────────────────────────────────────────────
 * `showScanButton` is `isNativePlatform`, so on the web this renders
 * nothing — which is exactly why it kept getting copied rather than
 * noticed: the shopping and storage pages carried the same nine lines,
 * guard and `aria-label` included, and neither the e2e run nor the web
 * build exercises the branch that shows it.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { barcodeOutline } from 'ionicons/icons';
import { HouseholdListPageFacade } from '../../data';

@Component({
  selector: 'app-household-scan-button',
  template: `
    @if (facade.showScanButton) {
      <ion-button
        [attr.aria-label]="'household.a11y.scan' | translate"
        (click)="facade.scan()"
      >
        <ion-icon slot="icon-only" name="barcode-outline" aria-hidden="true" />
      </ion-button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class HouseholdScanButtonComponent {
  readonly facade = inject(HouseholdListPageFacade);

  constructor() {
    addIcons({ barcodeOutline });
  }
}
