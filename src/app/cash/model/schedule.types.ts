/* ─── why ─────────────────────────────────────────────────────────
 * A schedule is NOT a `CashRule` with extra fields, though both recognise a
 * booking by `CashFilterCondition`. Three reasons, and the third decides it:
 * every transaction wants a category while only a dozen are fixed costs, so
 * merged most rules would carry dead fields; `order` means first-match-wins
 * for rules, where two schedules matching one booking is a bug to SHOW, not
 * to swallow silently; and `recategorizations` is pure and re-runnable,
 * while a schedule learning its amount holds state — merging would turn a
 * re-derivation into a write path.
 *
 * `amountCents` is an ESTIMATE, last seen rather than declared, so rent
 * rising from 900 to 950 is confirmed at import instead of costing a rule
 * rewrite. It stays signed, like a booking: an expected salary is income.
 *
 * `nextDueISO` is a date, not a day-of-month — that is what lets a quarterly
 * premium name its actual month rather than the reserve guessing which of
 * three it falls in.
 * ───────────────────────────────────────────────────────────────── */
import { BaseItem } from '../../@shared/model/base-item.types';
import { CategoryId } from '../../@shared/model/category.types';
import { Timestamp } from '../../@shared/model/app.types';
import { CashFilterCondition, ConditionForm } from './rule.types';

export interface CashSchedule extends BaseItem {
  match: 'all' | 'any';
  conditions: CashFilterCondition[];
  amountCents: number;
  periodMonths: number;
  nextDueISO: Timestamp;
  categoryId?: CategoryId;
  lastSeenISO?: Timestamp;
}

export type ScheduleDueStatus = 'upcoming' | 'due' | 'overdue';

export interface ScheduleAmountChange {
  scheduleId: string;
  fromCents: number;
  toCents: number;
  transactionId: string;
  seenISO: Timestamp;
}

export type ScheduleForm = {
  name: string;
  match: 'all' | 'any';
  categoryId: CategoryId;
  amountCents: number | null;
  periodMonths: number;
  nextDue: string;
  conditions: ConditionForm[];
};
