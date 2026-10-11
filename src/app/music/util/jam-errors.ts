import { ConnectOutcome } from '../model/music.types';

const statusOf = (error: unknown): number | undefined => {
  const response = (error as { response?: { status?: unknown } } | null)
    ?.response;
  if (typeof response?.status === 'number') return response.status;
  const message = error instanceof Error ? error.message : String(error);
  const match = /status code (\d{3})/.exec(message);
  return match?.[1] ? Number(match[1]) : undefined;
};

export const isAuthRefused = (error: unknown): boolean => {
  const status = statusOf(error);
  return status === 401 || status === 403;
};

export const connectOutcomeOf = (error: unknown): ConnectOutcome => {
  const status = statusOf(error);
  if (status === undefined) return 'unreachable';
  return status === 401 || status === 403 ? 'refused' : 'rejected';
};

export const normalizeServer = (server: string): string => {
  const trimmed = server
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/jam\/v1$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
