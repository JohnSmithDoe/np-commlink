import { BaseItem } from '../../model/base-item.types';
import { Category, CategoryId, CategoryList } from '../../model/category.types';
import { matchingTxt } from '../app.utils';

export const addToCatalog = <T extends CategoryList>(
  catalog: T,
  category: Category
): T => {
  const name = category.name.trim();
  if (name.length === 0) return catalog;
  const isExists = catalog.items.some(
    (entry) =>
      entry.id === category.id || matchingTxt(entry.name) === matchingTxt(name)
  );
  return isExists
    ? catalog
    : { ...catalog, items: [{ ...category, name }, ...catalog.items] };
};

export const removeFromCatalog = <T extends CategoryList>(
  catalog: T,
  categoryId: CategoryId
): T => {
  return {
    ...catalog,
    items: catalog.items.filter((entry) => entry.id !== categoryId),
  };
};

export const mergeTargetForRename = (
  items: readonly Category[],
  categoryId: CategoryId,
  targetName: string
): CategoryId | undefined => {
  const to = targetName.trim();
  return to.length === 0 || items.every((entry) => entry.id !== categoryId)
    ? undefined
    : items.find(
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
  if (!hasTarget || to.length === 0) return { catalog };

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
): T[] => {
  return items.map((item) => {
    return item.categoryIds?.includes(categoryId)
      ? {
          ...item,
          categoryIds: item.categoryIds.filter((id) => id !== categoryId),
        }
      : item;
  });
};

export const idsTaggedWith = (
  items: readonly BaseItem[],
  categoryId: CategoryId
): string[] => {
  return items
    .filter((item) => item.categoryIds?.includes(categoryId))
    .map((item) => item.id);
};

export const restoreCategoryRef = <T extends BaseItem>(
  items: readonly T[],
  categoryId: CategoryId,
  tagged: ReadonlySet<string>
): T[] => {
  return items.map((item) => {
    return tagged.has(item.id) && !item.categoryIds?.includes(categoryId)
      ? { ...item, categoryIds: [...(item.categoryIds ?? []), categoryId] }
      : item;
  });
};

export const remapCategoryRef = <T extends BaseItem>(
  items: readonly T[],
  from: CategoryId,
  to: CategoryId
): T[] => {
  return items.map((item) => {
    return item.categoryIds?.includes(from)
      ? {
          ...item,
          categoryIds: [
            ...new Set(item.categoryIds.map((id) => (id === from ? to : id))),
          ],
        }
      : item;
  });
};
