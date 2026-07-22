import { InjectionToken, Signal } from '@angular/core';
import { TCategoryId, TItemListCategory } from '../../types';

/**
 * Domain-blind contract the generic {@link EditCategoriesPage} binds against —
 * the category-management sibling of {@link IListPageFacade}. Each
 * category-owning domain provides an implementation via the
 * {@link CATEGORIES_FACADE} token: grocery's drives the shared catalog scoped to
 * the `:listId` route param (per-list counts, drill into that list); tasks' is a
 * trivial single-list one. Like the list facade this inverts the
 * selector-can't-read-DI constraint (the facade is a service, so it can hold
 * `store.selectSignal(...)`) and keeps the page smart yet identity-free.
 *
 * `drillTo` is the category→items affordance: it navigates to the owning list
 * pre-filtered to the tapped category (via the list's existing `filterBy`).
 */
export interface ICategoriesPageFacade {
  /** i18n key for the owning list's name, shown as the page subtitle. */
  readonly listTitleKey: Signal<string>;
  /** Router path of the owning list — the back target and the drill base. */
  readonly listHref: Signal<string>;
  /** The authoritative catalog decorated with per-list item counts. */
  readonly categories: Signal<{ category: TItemListCategory; count: number }[]>;

  add(name: string): void;
  rename(id: TCategoryId, name: string): void;
  remove(id: TCategoryId): void;
  /** Navigate to the owning list filtered down to this category. */
  drillTo(id: TCategoryId): void;
}

export const CATEGORIES_FACADE = new InjectionToken<ICategoriesPageFacade>(
  'CATEGORIES_FACADE'
);
