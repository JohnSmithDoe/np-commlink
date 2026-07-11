import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cafeOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';

/**
 * SOYKAF — standby mount point for the `np-kitchen-bot` app.
 *
 * This is the seam: when np-kitchen-bot is merged in, either replace this
 * placeholder's body with the real feature, or repoint the `/soykaf` route
 * at it and flip the SOYKAF program to `status: 'online'` on the commlink
 * deck (see commlink.page.ts).
 */
@Component({
  selector: 'app-page-kitchen',
  templateUrl: './kitchen.page.html',
  styleUrls: ['./kitchen.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonIcon, RouterLink, PageHeaderComponent],
})
export class KitchenPage {
  constructor() {
    addIcons({ cafeOutline, arrowBackOutline });
  }
}
