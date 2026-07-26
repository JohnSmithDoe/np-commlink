import { createActionGroup } from '@ngrx/store';
import { ICategory, TCategoryId } from '../../../@shared/model/category.types';

// Grocery categories are ONE catalog shared across the three grocery lists
// (products / shopping / storage), so cross-list copy (createXFromY,
// addShoppinglistToStorage) carries category ids that are valid on every list.
// These ops are therefore handled by ALL THREE grocery reducers with the SAME
// pre-minted {id,name} — the id is generated once at the dispatch site (the
// picker mints it on `addNew`) so the three catalogs stay in lockstep. Tasks and
// cash own independent catalogs (no cross-domain copy), so they keep their own
// per-slice category actions.
export const GroceryCategoriesActions = createActionGroup({
  source: 'GroceryCategories',
  events: {
    Add: (category: ICategory) => ({ category }),
    Remove: (id: TCategoryId) => ({ id }),
    Rename: (id: TCategoryId, name: string) => ({ id, name }),
  },
});
