import { createActionGroup, emptyProps } from '@ngrx/store';
import { IBaseItem, TItemListCategory, TItemListId } from '../../types';

// The domain-blind edit-dialog OPEN-command. After the dialog refactor the
// per-keystroke draft lives locally in each domain's feature wrapper, so the
// kernel only carries "open (this item, on this list)" + "hide" — the draft
// update/confirm/abort events are gone (the wrapper saves its own draft via its
// domain's addOrUpdateItem action).
//prettier-ignore
export const ItemDialogsActions = createActionGroup({
  source: 'ItemDialogs',
  events: {
    'Show Edit Dialog': (item: IBaseItem, listId: TItemListId,  additional?: TItemListId) => ({ item, listId, additional }),
    'Show Create Dialog With Search': (listId: TItemListId) => ({ listId }),
    'Show Create And Add Product Dialog': (listId: TItemListId) => ({ listId }),
    'Hide Dialog': emptyProps(),
  },
});

// The category-RENAME flow only (opened from the list's categories display
// mode). The category-SELECTION events (add/toggle/search/select/confirm) are
// gone — that flow is now local to the pure-ui categories-dialog.
export const CategoriesActions = createActionGroup({
  source: 'Categories',
  events: {
    'Show Edit Dialog': (category: TItemListCategory, listId: TItemListId) => ({
      category,
      listId,
    }),
    'Update Category': (category: TItemListCategory) => ({ category }),
    'Confirm Edit Changes': emptyProps(),
    'Abort Edit Changes': emptyProps(),
  },
});
