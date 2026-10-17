import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { HEXAGRAMS } from '../../model/iching.consts';
import { hexagramGlyph } from '../../util/hexagram.utils';

const HEXAGRAM_VIEWS = HEXAGRAMS.map((record) => {
  return {
    record,
    glyph: hexagramGlyph(record),
  };
});

@Component({
  selector: 'app-page-vitals-browse-iching',
  templateUrl: './browse-iching.page.html',
  styleUrls: ['./browse-iching.page.scss'],
  imports: [
    IonContent,
    RouterLink,
    TranslatePipe,
    PageHeaderComponent,
    PageReturnComponent,
  ],
})
export class VitalsBrowseIChingPage {
  readonly hexagrams = HEXAGRAM_VIEWS;
}
