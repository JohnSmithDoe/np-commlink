/* ─── why ─────────────────────────────────────────────────────────
 * The three buttons are unrolled, not looped: a `data-testid` may never be
 * composed at the call site, and a bound one inside `@for` is composition.
 *
 * The labels are their own keys rather than the `list-header.*` ones they
 * duplicate in meaning — a tab label is sized by the control, and German
 * "Dauerhafte Einträge" overflows a third of a 393px viewport. Sharing
 * would put that overflow one translation edit away.
 *
 * `ionChange` fires on interaction only, but `[value]` is bound to the
 * route, so a navigation writes it back and the guard in `switchList` is
 * what stops that becoming a second navigation. Reading the active list
 * off the route is also why the segment cannot disagree with a deep link.
 * ───────────────────────────────────────────────────────────────── */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonSegment,
  IonSegmentButton,
  IonToolbar,
  SegmentCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { HouseholdListPageFacade } from '../../data';
import { isHouseholdListId } from '../../model/household-list.types';

@Component({
  selector: 'app-household-list-switcher',
  templateUrl: './household-list-switcher.component.html',
  styleUrl: './household-list-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSegment, IonSegmentButton, IonToolbar, TranslatePipe],
})
export class HouseholdListSwitcherComponent {
  readonly facade = inject(HouseholdListPageFacade);

  switchList({ detail }: SegmentCustomEvent): void {
    const listId = String(detail.value ?? '');
    if (isHouseholdListId(listId)) this.facade.switchList(listId);
  }
}
