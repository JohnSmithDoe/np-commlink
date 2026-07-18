import { createTrackingItem } from './tracking.factory';

describe('tracking.factory', () => {
  describe('createTrackingItem', () => {
    it('starts in the stopped state with a base item', () => {
      const item = createTrackingItem('Deep work');
      expect(item.name).toBe('Deep work');
      expect(item.state).toBe('stopped');
      expect(item.id).toBeTruthy();
    });
  });
});
