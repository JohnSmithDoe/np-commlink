import dayjs from 'dayjs';
import { Address } from '../model/people.types';

export const ageOn = (birthDate: string, today: string): number =>
  dayjs(today).diff(dayjs(birthDate), 'year');

export const isBlankAddress = (address: Address): boolean =>
  Object.values(address).every((part) => !part.trim());

export const addressLines = (address: Address): string[] => {
  return [
    address.street,
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.country,
  ]
    .map((line) => line.trim())
    .filter(Boolean);
};
