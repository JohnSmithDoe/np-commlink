/* ─── why ─────────────────────────────────────────────────────────
 * Unencapsulated, because the prose arrives as `[innerHTML]`: injected
 * nodes carry no `_ngcontent` attribute, so an emulated stylesheet can
 * never reach the `<strong>`, `<code>` and `<a>` the content is allowed
 * to use. `::ng-deep` is the other way in and it is on its way out, so
 * every selector here is nested under `.hb-article` instead — the
 * namespace is what keeps the sheet from escaping.
 *
 * Sanitizing is Angular's: the asset pipeline promises a closed tag set,
 * and `[innerHTML]` distrusts it anyway.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { handLeftOutline, warningOutline } from 'ionicons/icons';
import { HANDBOOK_SECTION_ICON } from '../../model/handbook.consts';
import {
  HandbookPageContent,
  HandbookSectionKind,
} from '../../model/handbook.types';
import { handbookImageUrl, plainTextOf } from '../../util/handbook-content';
import { HandbookTitleComponent } from '../handbook-title/handbook-title.component';

@Component({
  selector: 'app-handbook-article',
  templateUrl: 'handbook-article.component.html',
  styleUrls: ['handbook-article.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [IonIcon, HandbookTitleComponent],
})
export class HandbookArticleComponent {
  readonly page = input.required<HandbookPageContent>();

  constructor() {
    addIcons({ handLeftOutline, warningOutline });
  }

  sectionIcon(kind: HandbookSectionKind): string | undefined {
    return HANDBOOK_SECTION_ICON[kind];
  }

  figureUrl(fileName: string): string {
    return handbookImageUrl(fileName);
  }

  captionText(caption: string): string {
    return plainTextOf(caption);
  }
}
