import {
  IProductsState,
  IShoppingState,
  IStorageState,
} from './grocery-list.types';
import { ICategoryList } from '../../@shared/model/category.types';
import { IListSettings } from './list-settings.types';
import { IRecipesState } from './recipe.types';

// The whole grocery bounded context in ONE slice (store key `groceries`,
// persisted as `npc-groceries`). Its aggregates cross-read each other — the
// search buckets join the three lists, the recipe matcher joins products with
// storage, every list reads the same listSettings flags — so they share one
// atomic hydration instead of being separate slices a route has to remember to
// co-register. The cross-list engine helpers take this whole state.
//
// `quickAdd` is deliberately NOT a member: it is derived, ephemeral UI state the
// engine recomputes on search/mode changes and nothing should persist.
export type IGroceriesState = {
  storage: IStorageState;
  products: IProductsState;
  shopping: IShoppingState;
  recipes: IRecipesState;
  listSettings: IListSettings;
  // ONE catalog for all three lists — it used to be copied into each of them,
  // kept in step only by every list reducer reacting to the same event.
  categories: ICategoryList;
};
