import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { LIFE_NUMBERS } from '../../model/iching.consts';

@Component({
  selector: 'app-page-vitals-browse-life',
  templateUrl: './browse-life.page.html',
  styleUrls: ['./browse-life.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseLifePage {
  readonly numbers = LIFE_NUMBERS;
}
