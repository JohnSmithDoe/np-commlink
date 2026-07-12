import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  IGlobalItem,
  IShoppingItem,
  IStorageItem,
  TItemListCategory,
  TItemListMode,
  TItemListSortType,
  TUpdateDTO,
} from '../../@shared/types';

export const GlobalsActions = createActionGroup({
  source: 'Globals',
  events: {
    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: IGlobalItem) => ({ item }),
    'Add Item From Search': emptyProps(),
    'Add Storage Item': (item: IStorageItem) => ({ item }),
    'Add Global Item': (item: IGlobalItem) => ({ item }),
    'Add Shopping Item': (item: IShoppingItem) => ({ item }),

    // Operations

    'Add Item': (item: IGlobalItem) => ({ item }),
    'Add Item Failure': (item: IGlobalItem) => ({ item }),
    'Add Category': (category: TItemListCategory) => ({ category }),
    'Remove Category': (category: TItemListCategory) => ({ category }),
    'Update Category': (
      original: TItemListCategory,
      newName: TItemListCategory
    ) => ({ original, newName }),

    'Remove Item': (item: IGlobalItem) => ({ item }),
    'Update Item': (item: TUpdateDTO<IGlobalItem>) => ({ item }),
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Filter': (filterBy?: string) => ({ filterBy }),
    'Update Mode': (mode?: TItemListMode) => ({ mode }),
    'Update Sort': (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
