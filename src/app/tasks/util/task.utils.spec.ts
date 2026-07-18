import { isTaskItem } from './task.utils';
import { mockTaskItem } from '../testing/tasks.test-data';

describe('task.utils', () => {
  describe('isTaskItem', () => {
    it('detects an own "prio" property', () => {
      expect(isTaskItem(mockTaskItem({ prio: 1 }))).toBe(true);
      expect(isTaskItem(mockTaskItem())).toBe(false);
    });
  });
});
