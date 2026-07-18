import { createActionGroup, emptyProps } from '@ngrx/store';
import {
  TItemListCategory,
  TItemListMode,
  TItemListSortType,
  TUpdateDTO,
} from '../../@shared/types';
import { IProduct, IShoppingItem, IStorageItem } from '../model';

export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    // Effects only
    'Enter Page': emptyProps(),
    'Add Or Update Item': (item: IProduct) => ({ item }),
    'Add Item From Search': emptyProps(),
    'Add Storage Item': (item: IStorageItem) => ({ item }),
    'Add Product': (item: IProduct) => ({ item }),
    'Add Shopping Item': (item: IShoppingItem) => ({ item }),

    // Operations

    'Add Item': (item: IProduct) => ({ item }),
    'Add Item Failure': (item: IProduct) => ({ item }),
    'Add Category': (category: TItemListCategory) => ({ category }),
    'Remove Category': (category: TItemListCategory) => ({ category }),
    'Update Category': (
      original: TItemListCategory,
      newName: TItemListCategory
    ) => ({ original, newName }),

    'Remove Item': (item: IProduct) => ({ item }),
    'Update Item': (item: TUpdateDTO<IProduct>) => ({ item }),
    'Update Search': (searchQuery?: string) => ({ searchQuery }),
    'Update Filter': (filterBy?: string) => ({ filterBy }),
    'Update Mode': (mode?: TItemListMode) => ({ mode }),
    'Update Sort': (
      sortBy?: TItemListSortType,
      sortDir?: 'asc' | 'desc' | 'keep' | 'toggle'
    ) => ({ sortBy, sortDir }),
  },
});
