import { providePersistedContext } from '../../@shared/data/persisted-states/persisted-context.provider';
import { SOURCE_PREFIX_BY_LIST_ID } from '../util/household-list.utils';
import { createMetric } from '../../@shared/data/persisted-states/persisted-slice.effects.factory';
import { HouseholdActions } from './household.actions';
import { householdCategoriesListEffects } from './categories/household-categories.effects';
import { ListSettingsActions } from './list-settings/list-settings.actions';
import { householdReducer } from './household.reducer';
import {
  HouseholdListEffects,
  householdRouteFilterEffects,
  productsListEffects,
  shoppingListEffects,
  storageListEffects,
} from './list/household-list.effects';
import { ListSettingsEffects } from './list-settings/list-settings.effects';
import { ShoppingEffects } from './shopping/shopping.effects';
import { StorageEffects } from './storage/storage.effects';
import {
  HOUSEHOLD_STATE_KEY,
  selectHouseholdState,
} from './household.selector';
import { selectProductCount } from './products/products.selector';
import { recipesListEffects } from './recipes/recipes.effects';
import { selectRecipeCount } from './recipes/recipes.selector';
import { selectActiveShoppingCount } from './shopping/shopping.selector';
import { selectLowStockCount } from './storage/storage.selector';

export const householdContext = providePersistedContext({
  key: HOUSEHOLD_STATE_KEY,
  reducer: householdReducer,
  lifecycle: HouseholdActions,
  select: selectHouseholdState,
  save: {
    sources: [
      ...Object.values(SOURCE_PREFIX_BY_LIST_ID),
      '[HouseholdCategories]',
      '[Recipes]',
    ],
    on: [ListSettingsActions.updateSettings],
  },
  telemetry: [
    {
      source: 'products',
      select: selectProductCount,
      metrics: createMetric('count'),
    },
    {
      source: 'shopping',
      select: selectActiveShoppingCount,
      metrics: createMetric('active'),
    },
    {
      source: 'storage',
      select: selectLowStockCount,
      metrics: createMetric('low'),
    },
    {
      source: 'recipes',
      select: selectRecipeCount,
      metrics: createMetric('count'),
    },
  ],
  effects: [
    HouseholdListEffects,
    householdRouteFilterEffects,
    ShoppingEffects,
    StorageEffects,
    ListSettingsEffects,
    shoppingListEffects,
    storageListEffects,
    productsListEffects,
    recipesListEffects,
    householdCategoriesListEffects,
  ],
});
