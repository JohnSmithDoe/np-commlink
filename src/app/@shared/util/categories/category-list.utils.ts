import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId, CategoryList } from '../../model/category.types';
import { matchingTxt } from '../app.utils';

export const addToCatalog = <T extends CategoryList>(
  catalog: T,
  category: Category
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

export const removeFromCatalog = <T extends CategoryList>(
  catalog: T,
  categoryId: CategoryId
): T => ({
  ...catalog,
  items: catalog.items.filter((entry) => entry.id !== categoryId),
});

export const mergeTargetForRename = (
  items: readonly Category[],
  categoryId: CategoryId,
  targetName: string
): CategoryId | undefined => {
  const to = targetName.trim();
  if (to.length === 0 || !items.some((entry) => entry.id === categoryId)) {
    return undefined;
  }
  return items.find(
    (entry) =>
      entry.id !== categoryId && matchingTxt(entry.name) === matchingTxt(to)
  )?.id;
};

export const renameInCatalog = <T extends CategoryList>(
  catalog: T,
  categoryId: CategoryId,
  targetName: string
): { catalog: T; mergedInto?: CategoryId } => {
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

export const dropCategoryRef = <T extends BaseItem>(
  items: readonly T[],
  categoryId: CategoryId
): T[] =>
  items.map((item) =>
    item.categoryIds?.includes(categoryId)
      ? {
          ...item,
          categoryIds: item.categoryIds.filter((id) => id !== categoryId),
        }
      : item
  );

export const remapCategoryRef = <T extends BaseItem>(
  items: readonly T[],
  from: CategoryId,
  to: CategoryId
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
