import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { ICategory } from '../../../@shared/model/category.types';

/**
 * The grocery catalog's own list surface.
 *
 * ONE catalog serves all three grocery lists (products / shopping / storage), so
 * cross-list copy (`createXFromY`, `addShoppinglistToStorage`) carries category
 * ids that are valid on every list. That used to cost a fan-out: three events
 * handled by ALL THREE list reducers with the same pre-minted `{id,name}`, so each
 * list kept its own copy of one catalog and the copies stayed in lockstep only by
 * every reducer remembering to react. The catalog is a list of its own now — one
 * copy, one handler.
 *
 * The generic list events, because the shared list page and the shared edit dialog
 * drive the catalog exactly as they drive the item lists.
 */
export const GroceryCategoriesActions = createActionGroup({
  source: 'GroceryCategories',
  events: createItemListActionEvents<ICategory>(),
});
