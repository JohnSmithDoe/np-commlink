/* ─── why ─────────────────────────────────────────────────────────
 * The OS keys a scheduled notification by a single integer and reveals
 * nothing else on tap, so a reminder needs both an id no other domain
 * reuses and a destination the shell can resolve. Keeping them in one
 * row means adding a reminder is one edit that will not compile until
 * both halves are filled in; two tables would let a new source ship with
 * an id and no way back to the thing it is reminding you about.
 *
 * A source whose reminders are many — one per pill per weekday — carries
 * `idBase` INSTEAD of `id`, and owns every integer above it. `FixedIdSource`
 * is what keeps the difference honest: the single-id methods take that
 * narrower type, so reaching for a ranged source without saying which of
 * its ids you mean does not compile.
 * ───────────────────────────────────────────────────────────────── */
export const NOTIFICATION_SOURCES = {
  officeReminder: { id: 1, route: '/office-time' },
  ritualReminder: { id: 2, route: '/ritual' },
  debugPing: { id: 99, route: '/notifications' },
  pillReminder: { idBase: 1000, route: '/vitals' },
} as const;

export type NotificationSource = keyof typeof NOTIFICATION_SOURCES;

export type FixedIdSource = {
  [K in NotificationSource]: 'id' extends keyof (typeof NOTIFICATION_SOURCES)[K]
    ? K
    : never;
}[NotificationSource];
