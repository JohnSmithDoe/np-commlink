/* ─── why ─────────────────────────────────────────────────────────
 * The flags page left the deck catalog, so no drawer row and no tile can
 * offer it and the three list toolbars are its only entrance. One
 * component rather than eight lines per page: the scan button beside it
 * was copied twice before anyone noticed.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-household-list-settings-button',
  templateUrl: 'household-list-settings-button.component.html',
  styleUrl: 'household-list-settings-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, RouterLink, TranslatePipe],
})
export class HouseholdListSettingsButtonComponent {
  constructor() {
    addIcons({ optionsOutline });
  }
}
