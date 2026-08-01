import { IBaseItem } from './base-item.types';
import { IItemList } from './item-list.types';

export type TCategoryId = string;

// A category is a named row in a list, which is what `IBaseItem` already is —
// so a catalog is an `IItemList<ICategory>` rendered by the ordinary list page
// instead of a parallel model with a parallel page. The inherited `categoryIds`
// is a category's own parent reference: declared, deliberately unwritten until
// there is a UI for the tree, and free of a migration because it is optional.
export interface ICategory extends IBaseItem {}

/**
 * A catalog: the list of categories a domain's item lists reference by id.
 *
 * It is an `IItemList` like any other, which is the whole point — the shared list
 * page, its search, its sort and the shared edit dialog all work on it unchanged,
 * instead of a catalog needing a parallel page of its own.
 */
export type ICategoryList = IItemList<ICategory>;
