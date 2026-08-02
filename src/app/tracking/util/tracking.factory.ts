import { TrackingItem } from '../model/tracking.types';
import { createBaseItem } from '../../@shared/util/app.factory';

export function createTrackingItem(name: string): TrackingItem {
  const base = createBaseItem(name);
  return { ...base, state: 'stopped' };
}
