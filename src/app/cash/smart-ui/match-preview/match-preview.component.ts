/* ─── why ─────────────────────────────────────────────────────────
 * A blank condition value renders nothing, because `contains ''` matches
 * every booking in the ledger: a fresh dialog would open on "matches 320 of
 * 320" and a half-typed one would keep claiming it. `ready` is the same
 * predicate the form's `requireText` enforces before a save, so the preview
 * appears exactly when the rule has become answerable.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoryId } from '../../../@shared/model/category.types';
import { CashTransactionsFacade } from '../../data';
import { ConditionSet } from '../../model/rule.types';
import { matchSummary } from '../../util/derive.utils';
import { LocalizedDatePipe } from '../../util/formatting/localized-date.pipe';
import { MoneyEurPipe } from '../../util/formatting/money.pipe';

@Component({
  selector: 'app-cash-match-preview',
  templateUrl: './match-preview.component.html',
  styleUrls: ['./match-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonNote,
    TranslatePipe,
    LocalizedDatePipe,
    MoneyEurPipe,
  ],
})
export class CashMatchPreviewComponent {
  readonly #transactions = inject(CashTransactionsFacade);

  readonly conditionSet = input.required<ConditionSet>();
  readonly categoryId = input<CategoryId>('');

  readonly ready = computed(() => {
    const { conditions } = this.conditionSet();
    return (
      conditions.length > 0 &&
      conditions.every((condition) => condition.value.trim() !== '')
    );
  });

  readonly summary = computed(() =>
    matchSummary(
      this.conditionSet(),
      this.#transactions.allItems(),
      this.categoryId()
    )
  );
}
