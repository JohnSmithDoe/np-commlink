import { createFeatureSelector } from '@ngrx/store';
import { HouseholdState } from '../model/household.types';

export const HOUSEHOLD_STATE_KEY = 'household';

export const selectHouseholdState =
  createFeatureSelector<HouseholdState>(HOUSEHOLD_STATE_KEY);
