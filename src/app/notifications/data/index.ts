/**
 * Public API of the `notifications` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the page's facade and the eager providers
 * the kernel composes, and nothing else. The reducer, the inbox's own action
 * group, its display selectors and its effects are module internals and stay
 * hidden: importing them from outside
 * `notifications/data` is a Sheriff encapsulation violation. The write
 * vocabulary producers share is not here either — it is the published contract
 * in `@shared/data/actions`.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { NotificationsFacade } from './notifications.facade';
export { notificationsContext } from './notifications.providers';
