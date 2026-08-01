import { IBaseItem } from '../../model/base-item.types';
import {
  ICategory,
  ICategoryList,
  TCategoryId,
} from '../../model/category.types';
import { matchingTxt } from '../app.utils';

/**
 * Catalog reducer helpers, domain-blind.
 *
 * A catalog is an `ICategoryList`, so add/remove/rename are ordinary list
 * operations — what stays catalog-specific is only the two rules a plain item
 * list has no opinion about: a name may not appear twice, and renaming ONTO an
 * existing name merges rather than creating a duplicate.
 *
 * The item-side fixups are separate from the catalog-side ones because the two
 * now live in different objects. That is what lets one grocery catalog serve
 * three item lists: the owning reducer applies the same ref fixup to each of its
 * lists, instead of every list carrying its own copy of the catalog.
 */

/** Insert a pre-minted category, unless its id or name is already in there. */
export const addToCatalog = <T extends ICategoryList>(
  catalog: T,
  category: ICategory
): T => {
  const name = category.name.trim();
  if (name.length === 0) return catalog;
  const exists = catalog.items.some(
    (entry) =>
      entry.id === category.id || matchingTxt(entry.name) === matchingTxt(name)
  );
  return exists
    ? catalog
    : { ...catalog, items: [{ ...category, name }, ...catalog.items] };
};

export const removeFromCatalog = <T extends ICategoryList>(
  catalog: T,
  categoryId: TCategoryId
): T => ({
  ...catalog,
  items: catalog.items.filter((entry) => entry.id !== categoryId),
});

/**
 * The entry a rename would MERGE into — an existing, different entry already
 * carrying the target name. `undefined` means a plain rename.
 *
 * Exported because two sides have to reach the same verdict. The reducer remaps
 * the stored rows onto the survivor; an edit dialog open at that moment has to
 * remap its unsaved draft the same way, or its save re-asserts the id the
 * reducer just retired. Deriving that answer twice is how the two drift.
 */
export const mergeTargetForRename = (
  items: readonly ICategory[],
  categoryId: TCategoryId,
  targetName: string
): TCategoryId | undefined => {
  const to = targetName.trim();
  if (to.length === 0 || !items.some((entry) => entry.id === categoryId)) {
    return undefined;
  }
  return items.find(
    (entry) =>
      entry.id !== categoryId && matchingTxt(entry.name) === matchingTxt(to)
  )?.id;
};

/**
 * Rename by id. Renaming onto a name another entry already has MERGES: the
 * renamed entry is dropped and `mergedInto` names the survivor, so the caller
 * can remap the item references it owns. Absent `mergedInto` means a plain
 * rename — items reference by id, so they need no rewrite at all.
 */
export const renameInCatalog = <T extends ICategoryList>(
  catalog: T,
  categoryId: TCategoryId,
  targetName: string
): { catalog: T; mergedInto?: TCategoryId } => {
  const to = targetName.trim();
  const hasTarget = catalog.items.some((entry) => entry.id === categoryId);
  if (to.length === 0 || !hasTarget) return { catalog };

  const mergedInto = mergeTargetForRename(catalog.items, categoryId, to);
  if (mergedInto) {
    return {
      catalog: removeFromCatalog(catalog, categoryId),
      mergedInto,
    };
  }
  return {
    catalog: {
      ...catalog,
      items: catalog.items.map((entry) =>
        entry.id === categoryId ? { ...entry, name: to } : entry
      ),
    },
    mergedInto: undefined,
  };
};

/** Drop a dead category id off every item that referenced it. */
export const dropCategoryRef = <T extends IBaseItem>(
  items: readonly T[],
  categoryId: TCategoryId
): T[] =>
  items.map((item) =>
    item.categoryIds?.includes(categoryId)
      ? {
          ...item,
          categoryIds: item.categoryIds.filter((id) => id !== categoryId),
        }
      : item
  );

/** Point every reference at the surviving id after a merge, without duplicating. */
export const remapCategoryRef = <T extends IBaseItem>(
  items: readonly T[],
  from: TCategoryId,
  to: TCategoryId
): T[] =>
  items.map((item) =>
    item.categoryIds?.includes(from)
      ? {
          ...item,
          categoryIds: [
            ...new Set(item.categoryIds.map((id) => (id === from ? to : id))),
          ],
        }
      : item
  );
