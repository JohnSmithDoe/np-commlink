/**
 * Public API of the `notifications` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the display selectors the page renders
 * from and the lazy providers the route registers, and nothing else. The
 * reducer, initial state, the raw feature selector, and every effect (load,
 * save, telemetry, debug) are module internals and stay hidden: importing
 * them from outside `notifications/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export {
  selectDoneCollapsed,
  selectDoneNotifications,
  selectNewNotifications,
} from './notifications.selector';
export { notificationsLazyProviders } from './provide-notifications-lazy';
