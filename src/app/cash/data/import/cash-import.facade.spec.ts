import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import { CashImportPreview } from '../../model/import.types';
import { ScheduleAmountChange } from '../../model/schedule.types';
import {
  mockCashAccount,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { CashSchedulesActions } from '../schedules/cash-schedules.actions';
import { CashTransactionsActions } from '../transactions/cash-transactions.actions';
import { CashImportFacade } from './cash-import.facade';

const imported = mockCashTransaction({ id: 'i1', source: 'imported' });
const confirmation = {
  id: 'p1',
  importKey: 'giro|REF-1',
  dateISO: '2026-01-07T00:00:00+01:00',
};
const sighting: ScheduleAmountChange = {
  scheduleId: 'cash-schedule-1',
  fromCents: -90_000,
  toCents: -95_000,
  transactionId: 'i1',
  seenISO: '2026-01-07T00:00:00+01:00',
};

const ledger = mockCashState({
  accounts: [mockCashAccount({ openingBalanceCents: 10_000 })],
});

const preview = (
  overrides: Partial<CashImportPreview> = {}
): CashImportPreview => {
  return {
    accountId: 'cash-account-1',
    plan: { toImport: [], toConfirm: [], duplicates: 0, rejected: 0 },
    rows: [],
    sightings: [],
    amountChanges: [],
    hasWork: false,
    ...overrides,
  };
};

describe('CashImportFacade.commit', () => {
  let facade: CashImportFacade;
  let dispatch: ReturnType<typeof vi.spyOn>;
  const dispatched = (): unknown[] =>
    dispatch.mock.calls.map((call: unknown[]) => call[0]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingProviders({ cash: ledger })],
    });
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    facade = TestBed.inject(CashImportFacade);
  });

  it('imports, confirms, learns the amount and announces it', () => {
    facade.commit(
      preview({
        plan: {
          toImport: [imported],
          toConfirm: [confirmation],
          duplicates: 0,
          rejected: 0,
        },
        hasWork: true,
        sightings: [sighting],
        amountChanges: [
          {
            scheduleId: 'cash-schedule-1',
            scheduleName: 'Miete',
            fromCents: -90_000,
            toCents: -95_000,
          },
        ],
      })
    );

    expect(dispatched()).toEqual([
      CashTransactionsActions.importItems([imported], [confirmation]),
      CashSchedulesActions.applyAmountChanges([sighting]),
      NotificationsActions.toast({
        key: 'cash.schedule.amounts-learned',
        parameters: { count: 1 },
        color: 'medium',
      }),
    ]);
  });

  it('still records a sighting when every row was a duplicate', () => {
    facade.commit(preview({ sightings: [sighting] }));

    expect(dispatched()).toEqual([
      CashSchedulesActions.applyAmountChanges([sighting]),
    ]);
  });

  it('dispatches nothing when there is nothing to do', () => {
    facade.commit(preview());

    expect(dispatched()).toEqual([]);
  });

  it('warns when the ledger misses the bank closing balance', () => {
    facade.commit(
      preview({ closingBalanceCents: 9000, asOfISO: '2026-01-31' })
    );

    expect(dispatched()).toEqual([
      expect.objectContaining({
        message: expect.objectContaining({
          key: 'cash.import.balance-mismatch',
          color: 'warning',
        }),
      }),
    ]);
  });

  it('stays silent when the ledger matches the bank', () => {
    facade.commit(
      preview({ closingBalanceCents: 10_000, asOfISO: '2026-01-31' })
    );

    expect(dispatched()).toEqual([]);
  });
});
