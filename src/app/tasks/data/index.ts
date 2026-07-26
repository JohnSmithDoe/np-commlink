/**
 * Public API of the `tasks` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers get the action contract, the two page
 * facades, and the lazy context bundle, and nothing else. The reducer,
 * initial state, effects, and every selector are module internals and stay
 * hidden: importing them from outside `tasks/data` is a Sheriff
 * encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */
export { TasksActions } from './actions/tasks.actions';
export { TasksListPageFacade } from './tasks-list-page.facade';
export { TasksCategoriesPageFacade } from './tasks-categories-page.facade';
export { tasksContext } from './tasks.providers';
