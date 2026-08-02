import { Bank } from '../../model/account.types';
import { BankParser } from './bank-parser';
import { dkbParser } from './dkb.parser';
import { volksbankParser } from './volksbank.parser';

export const BANK_PARSERS: Record<Bank, BankParser> = {
  volksbank: volksbankParser,
  dkb: dkbParser,
};

export const BANK_OPTIONS = Object.keys(BANK_PARSERS) as readonly Bank[];

export const parserForBank = (
  bank: Bank | undefined
): BankParser | undefined => (bank ? BANK_PARSERS[bank] : undefined);
