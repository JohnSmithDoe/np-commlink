import { createTaskItem } from './task.factory';

describe('task.factory', () => {
  describe('createTaskItem', () => {
    it('creates a task with an optional priority', () => {
      expect(createTaskItem('Clean').prio).toBeUndefined();
      expect(createTaskItem('Clean', 'Home', 5).prio).toBe(5);
    });
  });
});
