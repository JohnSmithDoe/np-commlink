import { connectOutcomeOf, isAuthRefused, normalizeServer } from './jam-errors';

describe('jam errors', () => {
  it.each([
    [new Error('Request failed with status code 401'), 'refused'],
    [{ response: { status: 403 } }, 'refused'],
    [new Error('Request failed with status code 500'), 'rejected'],
    [new Error('Network Error'), 'unreachable'],
  ] as const)('reads %o as %s', (error, outcome) => {
    expect(connectOutcomeOf(error)).toBe(outcome);
  });

  it('treats only 401 and 403 as a refused session', () => {
    expect(isAuthRefused({ response: { status: 401 } })).toBe(true);
    expect(isAuthRefused({ response: { status: 404 } })).toBe(false);
  });

  it.each([
    ['music.example.org', 'https://music.example.org'],
    ['http://localhost:4040/', 'http://localhost:4040'],
    ['https://music.example.org/jam/v1', 'https://music.example.org'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeServer(input)).toBe(expected);
  });
});
