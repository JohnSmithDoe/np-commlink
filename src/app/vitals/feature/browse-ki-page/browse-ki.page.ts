import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { KI_STARS } from '../../model/astro.consts';

@Component({
  selector: 'app-page-vitals-browse-ki',
  templateUrl: './browse-ki.page.html',
  styleUrls: ['./browse-ki.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseKiPage {
  readonly stars = KI_STARS;
}
