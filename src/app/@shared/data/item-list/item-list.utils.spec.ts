import { describe, expect, it } from 'vitest';
import { IListState, ITrackingItem } from '../../types';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSort,
  updatedSearchQuery,
} from './item-list.utils';

const item = (id: string, name: string): ITrackingItem => ({
  id,
  name,
  createdAt: '2026-01-01',
  state: 'stopped',
});

const list = (items: ITrackingItem[]): IListState<ITrackingItem> => ({
  title: 'list',
  items,
});

describe('item-list.utils', () => {
  describe('addListItem', () => {
    it('prepends a named item', () => {
      const state = addListItem(list([item('1', 'A')]), item('2', 'B'));
      expect(state.items.map((i) => i.id)).toEqual(['2', '1']);
    });

    it('ignores an item with a blank name', () => {
      const start = list([]);
      expect(addListItem(start, item('2', '   '))).toBe(start);
    });
  });

  describe('removeListItem', () => {
    it('drops the item with the matching id', () => {
      const state = removeListItem(
        list([item('1', 'A'), item('2', 'B')]),
        item('1', 'A')
      );
      expect(state.items.map((i) => i.id)).toEqual(['2']);
    });
  });

  describe('updateListItem', () => {
    it('merges the update onto the matched item', () => {
      const state = updateListItem<IListState<ITrackingItem>, ITrackingItem>(
        list([item('1', 'A')]),
        { id: '1', name: 'Renamed', createdAt: '2026-01-01' }
      );
      expect(state.items[0].name).toBe('Renamed');
    });

    it('returns the state unchanged for a missing item or no match', () => {
      const start = list([item('1', 'A')]);
      expect(updateListItem(start, undefined)).toBe(start);
      expect(
        updateListItem<IListState<ITrackingItem>, ITrackingItem>(start, {
          id: '9',
          name: 'x',
          createdAt: '2026-01-01',
        })
      ).toBe(start);
    });
  });

  describe('updateListSort', () => {
    it('defaults a new sort to ascending', () => {
      expect(updateListSort('name', 'asc')).toEqual({
        sortBy: 'name',
        sortDir: 'asc',
      });
    });

    it('toggles against the current direction', () => {
      expect(updateListSort('name', 'toggle', 'asc')).toEqual({
        sortBy: 'name',
        sortDir: 'desc',
      });
    });

    it('keeps the current direction on "keep"', () => {
      expect(updateListSort('name', 'keep', 'desc')).toEqual({
        sortBy: 'name',
        sortDir: 'desc',
      });
    });

    it('returns undefined when there is nothing to sort by', () => {
      expect(updateListSort(undefined, 'asc')).toBeUndefined();
    });
  });

  describe('updatedSearchQuery', () => {
    it('keeps the query while the item name still contains it', () => {
      expect(updatedSearchQuery(item('1', 'Foobar'), 'Foo')).toBe('Foo');
    });

    it('clears the query once the name no longer matches', () => {
      expect(updatedSearchQuery(item('1', 'Renamed'), 'Foo')).toBeUndefined();
    });
  });
});
