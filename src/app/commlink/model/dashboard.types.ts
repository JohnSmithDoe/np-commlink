import { DashboardTelemetry } from '../../@shared/model/dashboard.types';

export type DashboardSummary = {
  source: string;
  metrics: DashboardTelemetry['metrics'];
};

export interface DashboardState {
  bySource: Record<string, DashboardTelemetry>;
}

export const SUMMARY_KEY_PREFIX = 'summary-';
export const summaryKey = (source: string): string =>
  SUMMARY_KEY_PREFIX + source;
