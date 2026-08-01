import { TBank } from '../../model/account.types';
import { IBankParser } from './bank-parser';
import { dkbParser } from './dkb.parser';
import { volksbankParser } from './volksbank.parser';

/** The parser registry — one per bank. Adding a bank = add its parser here. */
export const BANK_PARSERS: Record<TBank, IBankParser> = {
  volksbank: volksbankParser,
  dkb: dkbParser,
};

// Banks offered in the account dialog's bank picker. Derived from the registry
// so a bank cannot ship with a parser the picker never offers.
export const BANK_OPTIONS = Object.keys(BANK_PARSERS) as readonly TBank[];

/** The parser for an account's bank, or undefined (manual-only account). */
export const parserForBank = (
  bank: TBank | undefined
): IBankParser | undefined => (bank ? BANK_PARSERS[bank] : undefined);
