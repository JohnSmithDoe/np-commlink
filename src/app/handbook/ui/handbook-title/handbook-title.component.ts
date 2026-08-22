/* ─── why ─────────────────────────────────────────────────────────
 * Every page carries two names — the deck's and the plain one — for the
 * same reason the catalog does. The choice is CSS rather than a signal
 * because the skin is a document attribute, so no injection, no state,
 * and a flip repaints without the handbook knowing it happened. The
 * unused half is `display: none`, which keeps it out of the
 * accessibility tree too.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-handbook-title',
  templateUrl: 'handbook-title.component.html',
  styleUrls: ['handbook-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandbookTitleComponent {
  readonly deck = input.required<string>();
  readonly plain = input.required<string>();
}
