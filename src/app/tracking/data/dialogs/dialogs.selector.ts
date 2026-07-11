import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  IBaseItem,
  IEditItemState,
  IEditTrackingItemState,
  ITrackingItem,
} from '../../../@shared/types';

export const selectEditState =
  createFeatureSelector<IEditItemState<ITrackingItem>>('dialogs');

export const selectEditTrackingState =
  createFeatureSelector<IEditTrackingItemState>('dialogs');

export const selectEditItemTracking = createSelector(
  selectEditTrackingState,
  (state): ITrackingItem | undefined => state.item
);

export const selectEditItem = createSelector(
  selectEditState,
  (state): IBaseItem | undefined => state.item
);
