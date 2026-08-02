import { createActionGroup } from '@ngrx/store';
import { createItemListActionEvents } from '../../../@shared/data/item-lists/item-list.actions.factory';
import { Category } from '../../../@shared/model/category.types';

export const HouseholdCategoriesActions = createActionGroup({
  source: 'HouseholdCategories',
  events: createItemListActionEvents<Category>(),
});
