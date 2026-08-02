import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector } from '@ngrx/store';

const selectRouter = createFeatureSelector<RouterReducerState>('router');

export const { selectRouteParams } = getRouterSelectors(selectRouter);
