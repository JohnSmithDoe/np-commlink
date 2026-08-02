import { GeistLink } from '../model/geist.types';

export const linkForAvailability = (availability: Availability): GeistLink =>
  availability === 'unavailable'
    ? 'unsupported'
    : availability === 'available'
      ? 'reforging'
      : 'dormant';

export const openingLinkFor = (
  availability: Availability | 'probing'
): Extract<GeistLink, 'priming' | 'reforging'> =>
  availability === 'available' ? 'reforging' : 'priming';
