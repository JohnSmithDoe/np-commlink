import { createActionGroup, emptyProps } from '@ngrx/store';

export const ItemListRouteActions = createActionGroup({
  source: 'ItemListRoute',
  events: {
    clearCategoryFilter: emptyProps(),
  },
});
