import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../../@shared/model/app.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { KI_STARS, ZODIAC_SIGNS } from '../../model/astro.consts';
import { HEXAGRAMS, LIFE_NUMBERS } from '../../model/iching.consts';

interface BrowseSection {
  route: string;
  glyph: string;
  titleKey: Marker;
  descKey: Marker;
  count: number;
}

const SECTIONS: readonly BrowseSection[] = [
  {
    route: '/vitals/browse/zodiac',
    glyph: '♈',
    titleKey: marker('vitals.browse.zodiac.title'),
    descKey: marker('vitals.browse.zodiac.desc'),
    count: ZODIAC_SIGNS.length,
  },
  {
    route: '/vitals/browse/iching',
    glyph: '䷀',
    titleKey: marker('vitals.browse.iching.title'),
    descKey: marker('vitals.browse.iching.desc'),
    count: HEXAGRAMS.length,
  },
  {
    route: '/vitals/browse/ki',
    glyph: '☰',
    titleKey: marker('vitals.browse.ki.title'),
    descKey: marker('vitals.browse.ki.desc'),
    count: KI_STARS.length,
  },
  {
    route: '/vitals/browse/life',
    glyph: '九',
    titleKey: marker('vitals.browse.life.title'),
    descKey: marker('vitals.browse.life.desc'),
    count: LIFE_NUMBERS.length,
  },
];

@Component({
  selector: 'app-page-vitals-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, RouterLink, TranslatePipe, PageHeaderComponent],
})
export class VitalsBrowsePage {
  readonly sections = SECTIONS;
}
