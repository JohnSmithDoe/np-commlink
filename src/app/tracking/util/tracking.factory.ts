import { ITrackingItem } from '../model';
import { createBaseItem } from '../../@shared/util/app.factory';

// Tracking's item factory, moved out of the shared app.factory (DDD review #1)
// so @shared stops referencing ITrackingItem. Reuses the generic
// `createBaseItem` seed that stays shared.
export function createTrackingItem(name: string): ITrackingItem {
  const base = createBaseItem(name);
  return { ...base, state: 'stopped' };
}
