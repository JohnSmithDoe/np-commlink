import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { mockRouterState } from '../../../@shared/testing/test-data';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockCashAccount,
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { categoryIdOf } from '../../util/cash-category.utils';
import { CashTransactionsActions } from '../../data';
import { CashState } from '../../model/cash.types';
import { CashTransaction } from '../../model/transaction.types';
import { CashImportPreviewModalComponent } from '../../smart-ui/import-preview-modal/import-preview-modal.component';
import {
  camtDocument,
  camtEntry,
  TEST_IBAN,
} from '../../testing/camt.test-data';
import { CashAccountPage } from './cash-account.page';

const ACCOUNT_ID = 'cash-account-1';

const NORDKAUF_TEXT = 'NORDKAUF Markt GmbH';
const NORDKAUF_ENTRY = camtEntry({ ref: 'ref-nordkauf' });
const SALARY_ENTRY = camtEntry({
  ref: 'ref-salary',
  amount: '3570.00',
  direction: 'CRDT',
  date: '2026-01-11',
  name: 'Kestrel Systems GmbH',
  purpose: 'Honorar',
});
const UNREADABLE_ENTRY = '<Ntry><Amt Ccy="EUR">nonsense</Amt></Ntry>';

const camtFile = (...entries: string[]): File =>
  new File([camtDocument(entries)], 'report.xml');

const filePicked = (...files: File[]): Event =>
  ({ target: { files, value: 'report.xml' } }) as unknown as Event;

const importState = (transactions: CashTransaction[] = []): CashState =>
  mockCashState({
    accounts: [mockCashAccount({ iban: TEST_IBAN })],
    rules: [mockCashRule()],
    transactions,
  });

interface PreviewProperties {
  transactions: CashTransaction[];
  duplicates: number;
  rejected: number;
}

describe('CashAccountPage', () => {
  let component: CashAccountPage;
  let create: ReturnType<typeof vi.spyOn>;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const previewProperties = (): PreviewProperties =>
    (
      create.mock.lastCall as unknown as [{ componentProps: PreviewProperties }]
    )[0].componentProps;

  const setup = (state: CashState) => {
    TestBed.configureTestingModule({
      imports: [CashAccountPage],
      providers: [
        provideTestingProviders({
          cash: state,
          router: mockRouterState({ parameters: { accountId: ACCOUNT_ID } }),
        }),
      ],
    });
    create = vi
      .spyOn(TestBed.inject(ModalController), 'create')
      .mockResolvedValue({
        present: vi.fn(),
      } as unknown as HTMLIonModalElement);
    dispatch = vi.spyOn(TestBed.inject(Store), 'dispatch');
    component = TestBed.createComponent(CashAccountPage).componentInstance;
  };

  it('binds the routed account and lists only its ledger, newest first', () => {
    setup(
      mockCashState({
        accounts: [
          mockCashAccount({ name: 'Giro' }),
          mockCashAccount({ id: 'cash-account-2', name: 'Sparkonto' }),
        ],
        transactions: [
          mockCashTransaction({ id: 'older', dateISO: '2026-01-05' }),
          mockCashTransaction({ id: 'newer', dateISO: '2026-01-09' }),
          mockCashTransaction({
            id: 'foreign',
            accountId: 'cash-account-2',
            dateISO: '2026-01-31',
          }),
        ],
      })
    );

    expect(component.facade.accountId()).toBe(ACCOUNT_ID);
    expect(component.facade.account()?.name).toBe('Giro');
    expect(component.facade.items().map((txn) => txn.id)).toEqual([
      'newer',
      'older',
    ]);
  });

  it('shows the routed account balance, not the sum over all accounts', () => {
    setup(
      mockCashState({
        accounts: [
          mockCashAccount({ openingBalanceCents: 10_000 }),
          mockCashAccount({ id: 'cash-account-2' }),
        ],
        transactions: [
          mockCashTransaction({ amountCents: -1999 }),
          mockCashTransaction({
            id: 'foreign',
            accountId: 'cash-account-2',
            amountCents: -5000,
          }),
        ],
      })
    );

    expect(component.facade.balanceCents()).toBe(8001);
  });

  it('enables the import for a bank-backed account', () => {
    setup(importState());

    expect(component.facade.canImport()).toBe(true);
  });

  it('plans the picked statement and hands the preview its rows, categorized', async () => {
    setup(importState());

    await component.importStatement(
      filePicked(camtFile(NORDKAUF_ENTRY, SALARY_ENTRY))
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ component: CashImportPreviewModalComponent })
    );
    const { transactions, duplicates, rejected } = previewProperties();
    expect(transactions).toEqual([
      expect.objectContaining({
        accountId: ACCOUNT_ID,
        dateISO: expect.stringContaining('2026-01-06'),
        amountCents: -1999,
        name: NORDKAUF_TEXT,
        source: 'imported',
        status: 'confirmed',
      }),
      expect.objectContaining({ amountCents: 357_000 }),
    ]);
    expect(transactions.map((txn) => categoryIdOf(txn))).toEqual([
      'cash-cat-stuff',
      undefined,
    ]);
    expect(duplicates).toBe(0);
    expect(rejected).toBe(0);
  });

  it('stamps one batch id across the statement and a distinct id per row', async () => {
    setup(importState());

    await component.importStatement(
      filePicked(camtFile(NORDKAUF_ENTRY, SALARY_ENTRY))
    );

    const [first, second] = previewProperties().transactions;
    expect(first.importBatchId).toEqual(expect.any(String));
    expect(second.importBatchId).toBe(first.importBatchId);
    expect(second.id).not.toBe(first.id);
  });

  it('counts a row already imported into this account as a duplicate', async () => {
    setup(
      importState([
        mockCashTransaction({
          id: 'already-imported',
          dateISO: '2026-01-06',
          amountCents: -1999,
          name: NORDKAUF_TEXT,
          source: 'imported',
          importKey: 'ref-nordkauf',
        }),
      ])
    );

    await component.importStatement(
      filePicked(camtFile(NORDKAUF_ENTRY, SALARY_ENTRY))
    );

    const { transactions, duplicates } = previewProperties();
    expect(transactions.map((txn) => txn.amountCents)).toEqual([357_000]);
    expect(duplicates).toBe(1);
  });

  it('carries unreadable entries through to the preview as rejected', async () => {
    setup(importState());

    await component.importStatement(
      filePicked(camtFile(NORDKAUF_ENTRY, UNREADABLE_ENTRY))
    );

    const { transactions, rejected } = previewProperties();
    expect(transactions).toHaveLength(1);
    expect(rejected).toBe(1);
  });

  it('clears the file input so the same file can be picked again', async () => {
    setup(importState());
    const event = filePicked(camtFile(NORDKAUF_ENTRY));

    await component.importStatement(event);

    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('offers no import on a physical-cash account, which has no statement', () => {
    setup(mockCashState({ accounts: [mockCashAccount({ kind: 'cash' })] }));

    expect(component.facade.canImport()).toBe(false);
  });

  it('imports nothing when the picker was dismissed without a file', async () => {
    setup(importState());

    await component.importStatement(filePicked());

    expect(create).not.toHaveBeenCalled();
  });

  it('refuses a statement belonging to another account and imports nothing', async () => {
    setup(
      mockCashState({
        accounts: [mockCashAccount({ iban: 'DE97100900004711000200' })],
      })
    );

    await component.importStatement(filePicked(camtFile(NORDKAUF_ENTRY)));

    expect(create).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ key: 'cash.import.wrong-account' }),
      })
    );
  });

  it('adopts the IBAN of the first statement an account with none imports', async () => {
    setup(mockCashState({ accounts: [mockCashAccount()] }));

    await component.importStatement(filePicked(camtFile(NORDKAUF_ENTRY)));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({ iban: TEST_IBAN }),
      })
    );
    expect(create).toHaveBeenCalled();
  });

  it('leaves the IBAN alone once the account already carries it', async () => {
    setup(importState());

    await component.importStatement(filePicked(camtFile(NORDKAUF_ENTRY)));

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({ iban: TEST_IBAN }),
      })
    );
  });

  it('says so when the pick holds no camt document at all', async () => {
    setup(importState());

    await component.importStatement(
      filePicked(new File(['Buchungstag;Betrag'], 'umsaetze.csv'))
    );

    expect(create).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({ key: 'cash.import.unreadable' }),
      })
    );
  });

  it('reads every page of a paginated export as one import', async () => {
    setup(importState());

    await component.importStatement(
      filePicked(camtFile(NORDKAUF_ENTRY), camtFile(SALARY_ENTRY))
    );

    expect(previewProperties().transactions).toHaveLength(2);
  });

  it('detaches the manual leg a reconciliation absorbed', () => {
    setup(importState());

    void component.reconcileOrDetach({
      ...mockCashTransaction(),
      reconciledManualId: 'manual-leg',
    });

    expect(dispatch).toHaveBeenCalledWith(
      CashTransactionsActions.unreconcile('manual-leg')
    );
  });

  it('leaves a row that absorbed nothing alone', () => {
    setup(importState());

    void component.reconcileOrDetach(mockCashTransaction());

    expect(dispatch).not.toHaveBeenCalled();
  });
});
