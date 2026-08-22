/* ─── why ─────────────────────────────────────────────────────────
 * A pill owns a BLOCK of eight OS ids, not one: seven weekdays plus a
 * reserved offset zero, so the block is a shift rather than a multiply-add
 * nobody can read. Arming touches only the weekdays a pill is due on, but
 * disarming must clear the whole block — the set that is due shrinks when
 * the schedule changes, and an id nobody re-schedules is an id nobody
 * cancels either.
 * ───────────────────────────────────────────────────────────────── */

import { IsoWeekday } from '../../@shared/model/app.types';
import { NOTIFICATION_SOURCES } from '../../@shared/model/notification-sources';
import { ISODate, IntakesState, Pill, VitalsId } from '../model/vitals.types';
import { EVERY_DAY } from './vitals.factory';

const SLOT_WIDTH = 8;

export const pillNotificationId = (slot: number, weekday: IsoWeekday): number =>
  NOTIFICATION_SOURCES.pillReminder.idBase + slot * SLOT_WIDTH + weekday;

export const pillNotificationBlock = (slot: number): number[] =>
  EVERY_DAY.map((weekday) => pillNotificationId(slot, weekday));

export const pillsOf = (pills: readonly Pill[], profileId: VitalsId): Pill[] =>
  pills.filter((pill) => pill.profileId === profileId);

export const isTakenOn = (
  intakes: IntakesState,
  pillId: VitalsId,
  date: ISODate
): boolean =>
  intakes.some((intake) => intake.pillId === pillId && intake.takenOn === date);

export const isEveryDay = (weekdays: readonly IsoWeekday[]): boolean =>
  weekdays.length === EVERY_DAY.length;

export const sortedWeekdays = (weekdays: readonly IsoWeekday[]): IsoWeekday[] =>
  EVERY_DAY.filter((day) => weekdays.includes(day));

export const toggledWeekday = (
  weekdays: readonly IsoWeekday[],
  day: IsoWeekday
): IsoWeekday[] =>
  weekdays.includes(day)
    ? weekdays.filter((existing) => existing !== day)
    : sortedWeekdays([...weekdays, day]);
