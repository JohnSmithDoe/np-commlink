/* ─── why ─────────────────────────────────────────────────────────
 * The OS keys a scheduled notification by a single integer and reveals
 * nothing else on tap, so a reminder needs both an id no other domain
 * reuses and a destination the shell can resolve. Keeping them in one
 * row means adding a reminder is one edit that will not compile until
 * both halves are filled in; two tables would let a new source ship with
 * an id and no way back to the thing it is reminding you about.
 * ───────────────────────────────────────────────────────────────── */
export const NOTIFICATION_SOURCES = {
  officeReminder: { id: 1, route: '/office-time' },
  ritualReminder: { id: 2, route: '/ritual' },
  debugPing: { id: 99, route: '/notifications' },
} as const;

export type NotificationSource = keyof typeof NOTIFICATION_SOURCES;
