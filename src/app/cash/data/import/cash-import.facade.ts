/* ─── why ─────────────────────────────────────────────────────────
 * One import is one transaction, and it used to be split: the page planned
 * it and handed a modal eight loose props, and the modal then decided what
 * counted as work and wrote through three facades. Neither half could be
 * read as the policy. `plan` answers what an import WOULD do and `commit`
 * performs it — the modal only renders the answer and says yes.
 *
 * The preview carries display names beside the ids because the modal is
 * then a pure reader of one object: resolving a category or a schedule name
 * needs the same two collections `plan` already holds open.
 * ───────────────────────────────────────────────────────────────── */
import { inject, Injectable } from '@angular/core';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashImportPreview } from '../../model/import.types';
import { categoryIdOf } from '../../util/cash-category.utils';
import {
  balanceDifferenceCents,
  lastEntryDateISO,
} from '../../util/import/balance-check';
import { ParseResult } from '../../util/import/parsed-row';
import { planImport } from '../../util/import/plan-import';
import {
  changedAmounts,
  scheduleSightingsFor,
} from '../../util/schedule.utils';
import { CashAccountsFacade } from '../accounts/cash-accounts.facade';
import { CashCategoriesFacade } from '../categories/cash-categories.facade';
import { CashRulesFacade } from '../rules/cash-rules.facade';
import { CashSchedulesFacade } from '../schedules/cash-schedules.facade';
import { CashTransactionsFacade } from '../transactions/cash-transactions.facade';

@Injectable({ providedIn: 'root' })
export class CashImportFacade {
  readonly #accounts = inject(CashAccountsFacade);
  readonly #categories = inject(CashCategoriesFacade);
  readonly #rules = inject(CashRulesFacade);
  readonly #schedules = inject(CashSchedulesFacade);
  readonly #transactions = inject(CashTransactionsFacade);

  plan(parsed: ParseResult, accountId: string): CashImportPreview {
    const plan = planImport(
      parsed,
      accountId,
      this.#rules.allItems(),
      this.#transactions.allItems(),
      uuidv4(),
      uuidv4
    );
    const sightings = scheduleSightingsFor(
      plan.toImport,
      this.#schedules.allItems()
    );
    const categoryName = categoryNameLookup(this.#categories.allItems());

    return {
      accountId,
      plan,
      sightings,
      rows: plan.toImport.map((transaction) => ({
        transaction,
        categoryName: categoryName(categoryIdOf(transaction)),
      })),
      amountChanges: changedAmounts(sightings).map((change) => ({
        scheduleId: change.scheduleId,
        scheduleName: this.#scheduleName(change.scheduleId),
        fromCents: change.fromCents,
        toCents: change.toCents,
      })),
      hasWork: plan.toImport.length > 0 || plan.toConfirm.length > 0,
      closingBalanceCents: parsed.closingBalanceCents,
      asOfISO: lastEntryDateISO(parsed.rows),
    };
  }

  commit(preview: CashImportPreview): void {
    const { plan, sightings, amountChanges, hasWork } = preview;
    if (hasWork) {
      this.#transactions.importItems(plan.toImport, plan.toConfirm);
    }
    if (sightings.length > 0) {
      this.#schedules.applyAmountChanges(sightings);
      if (amountChanges.length > 0) {
        this.#schedules.reportAmountsLearned(amountChanges.length);
      }
    }
    this.#reportBalanceDrift(preview);
  }

  adoptIban(accountId: string, iban: string): void {
    const account = this.#accountById(accountId);
    if (account && !account.iban) {
      this.#accounts.saveItem({ ...account, iban });
    }
  }

  #reportBalanceDrift({
    accountId,
    closingBalanceCents,
    asOfISO,
  }: CashImportPreview): void {
    if (closingBalanceCents === undefined || asOfISO === undefined) return;
    const account = this.#accountById(accountId);
    if (!account) return;

    const difference = balanceDifferenceCents(
      closingBalanceCents,
      asOfISO,
      accountId,
      account.openingBalanceCents,
      this.#transactions.allItems()
    );
    if (difference !== 0) this.#accounts.reportBalanceMismatch(difference);
  }

  #accountById(accountId: string) {
    return this.#accounts.allItems().find(({ id }) => id === accountId);
  }

  #scheduleName(scheduleId: string): string {
    return (
      this.#schedules.allItems().find(({ id }) => id === scheduleId)?.name ?? ''
    );
  }
}
