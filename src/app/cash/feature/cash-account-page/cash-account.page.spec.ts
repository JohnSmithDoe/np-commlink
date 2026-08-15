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
import { CashAccountPage } from './cash-account.page';

const ACCOUNT_ID = 'cash-account-1';

const CSV_HEADER =
  'Buchungstag;Valuta;Auftraggeber/Beguenstigter;Verwendungszweck;IBAN;BIC;Betrag;Glaeubiger-ID;Mandatsreferenz;Kundenreferenz';
const REWE_ROW =
  '06.01.2026;06.01.2026;REWE Markt GmbH;Einkauf;DE1;GENODEF1;-19,99;;;';
const REWE_TEXT = 'REWE Markt GmbH — Einkauf';
const SALARY_ROW =
  '11.01.2026;11.01.2026;Muster GmbH;Honorar;DE2;MARKDEF1;3.570,00;;;';
const UNREADABLE_ROW = 'Anfangssaldo;;;;;;1.000,00;;;';

const csvFile = (...rows: string[]): File =>
  new File([[CSV_HEADER, ...rows].join('\n')], 'umsaetze.csv');

const filePicked = (...files: File[]): Event =>
  ({ target: { files, value: 'umsaetze.csv' } }) as unknown as Event;

const importState = (transactions: CashTransaction[] = []): CashState =>
  mockCashState({
    accounts: [mockCashAccount({ bank: 'volksbank' })],
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

  it('enables the import once the account names a bank with a parser', () => {
    setup(importState());

    expect(component.facade.canImport()).toBe(true);
  });

  it('plans the picked CSV and hands the preview its rows, categorized', async () => {
    setup(importState());

    await component.importCsv(filePicked(csvFile(REWE_ROW, SALARY_ROW)));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ component: CashImportPreviewModalComponent })
    );
    const { transactions, duplicates, rejected } = previewProperties();
    expect(transactions).toEqual([
      expect.objectContaining({
        accountId: ACCOUNT_ID,
        dateISO: expect.stringContaining('2026-01-06'),
        amountCents: -1999,
        name: REWE_TEXT,
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

  it('stamps one batch id across the file and a distinct id per row', async () => {
    setup(importState());

    await component.importCsv(filePicked(csvFile(REWE_ROW, SALARY_ROW)));

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
          name: REWE_TEXT,
          source: 'imported',
        }),
      ])
    );

    await component.importCsv(filePicked(csvFile(REWE_ROW, SALARY_ROW)));

    const { transactions, duplicates } = previewProperties();
    expect(transactions.map((txn) => txn.amountCents)).toEqual([357_000]);
    expect(duplicates).toBe(1);
  });

  it('carries unreadable rows through to the preview as rejected', async () => {
    setup(importState());

    await component.importCsv(filePicked(csvFile(REWE_ROW, UNREADABLE_ROW)));

    const { transactions, rejected } = previewProperties();
    expect(transactions).toHaveLength(1);
    expect(rejected).toBe(1);
  });

  it('clears the file input so the same file can be picked again', async () => {
    setup(importState());
    const event = filePicked(csvFile(REWE_ROW));

    await component.importCsv(event);

    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('imports nothing for an account whose bank has no parser', async () => {
    setup(mockCashState({ accounts: [mockCashAccount()] }));

    await component.importCsv(filePicked(csvFile(REWE_ROW)));

    expect(component.facade.canImport()).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('imports nothing when the picker was dismissed without a file', async () => {
    setup(importState());

    await component.importCsv(filePicked());

    expect(create).not.toHaveBeenCalled();
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
