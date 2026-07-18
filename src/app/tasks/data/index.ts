/**
 * Public API of the `tasks` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the list-page
 * facade, the active-list items selector, and the lazy providers, and nothing
 * else. The reducer, initial state, list/dialog/save/load/telemetry effects,
 * and the internal feature/search selectors are module internals and stay
 * hidden: importing them from outside `tasks/data` is a Sheriff encapsulation
 * violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { TasksActions } from './tasks.actions';
export { TasksListPageFacade } from './tasks-list-page.facade';
export { selectTasksListItems, selectTasksCategories } from './tasks.selector';
// The tasks context's typed view of the shared, domain-blind itemDialogs slice
export { selectEditTaskItem } from './item-dialogs.selector';
export { tasksLazyProviders } from './provide-tasks-lazy';
