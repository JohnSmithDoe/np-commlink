import { mockCategory } from '../../testing/test-data';
import { categoriesByIds, categoryNameLookup } from './category.utils';

describe('category.utils', () => {
  describe('categoriesByIds', () => {
    const catalog = [
      mockCategory({ id: 'dairy', name: 'Dairy' }),
      mockCategory({ id: 'bakery', name: 'Bakery' }),
      mockCategory({ id: 'fresh', name: 'Fresh' }),
    ];

    it('returns [] for undefined ids', () => {
      expect(categoriesByIds(undefined, catalog)).toEqual([]);
    });

    it('resolves ids to their {id,name} objects, preserving input order', () => {
      expect(categoriesByIds(['fresh', 'dairy'], catalog)).toEqual([
        { id: 'fresh', name: 'Fresh' },
        { id: 'dairy', name: 'Dairy' },
      ]);
    });

    it('drops ids not present in the catalog', () => {
      expect(categoriesByIds(['dairy', 'missing'], catalog)).toEqual([
        { id: 'dairy', name: 'Dairy' },
      ]);
    });

    it('returns [] when no id matches', () => {
      expect(categoriesByIds(['nope'], catalog)).toEqual([]);
    });
  });

  describe('categoryNameLookup', () => {
    const catalog = [
      mockCategory({ id: 'dairy', name: 'Dairy' }),
      mockCategory({ id: 'bakery', name: 'Bakery' }),
    ];

    it('resolves the same names as categoryName, including the empty cases', () => {
      const lookup = categoryNameLookup(catalog);
      expect(lookup('dairy')).toBe('Dairy');
      expect(lookup('nope')).toBe('');
      expect(lookup(undefined)).toBe('');
    });

    it('indexes once — later catalog mutations do not leak in', () => {
      const mutable = [...catalog];
      const lookup = categoryNameLookup(mutable);
      mutable.push(mockCategory({ id: 'fresh', name: 'Fresh' }));
      expect(lookup('fresh')).toBe('');
    });
  });
});
