import {
  ProductsState,
  ShoppingState,
  StorageState,
} from './household-list.types';
import { CategoryList } from '../../@shared/model/category.types';
import { ListSettings } from './list-settings.types';
import { RecipesState } from './recipe.types';

export type HouseholdState = {
  storage: StorageState;
  products: ProductsState;
  shopping: ShoppingState;
  recipes: RecipesState;
  listSettings: ListSettings;
  categories: CategoryList;
};
