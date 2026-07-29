import { TGeistLink } from '../model/geist.types';

/**
 * What a probe's verdict means for the link. `unsupported` and `dormant` are
 * resting states the user has to act on (explain, or offer the download);
 * `available` means the weights are already local, so there is nothing to ask
 * about — the page opens a session straight away, in the state `openingLinkFor`
 * names for it.
 */
export const linkForAvailability = (availability: Availability): TGeistLink =>
  availability === 'unavailable'
    ? 'unsupported'
    : availability === 'available'
      ? 'reforging'
      : 'dormant';

/**
 * Opening a session is two very different waits, and the panel has to match:
 * the first one downloads multi-GB weights (`priming`, with a progress meter),
 * every later one only re-creates a session against local weights
 * (`reforging`, which keeps the console up rather than flashing a download UI at
 * someone who merely switched persona).
 */
export const openingLinkFor = (
  availability: Availability | 'probing'
): Extract<TGeistLink, 'priming' | 'reforging'> =>
  availability === 'available' ? 'reforging' : 'priming';
