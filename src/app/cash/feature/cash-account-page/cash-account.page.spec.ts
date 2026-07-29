import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';

import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockCashAccount,
  mockCashRule,
  mockCashState,
  mockCashTransaction,
} from '../../testing/cash.test-data';
import { CashActions } from '../../data';
import { ICashState } from '../../model/cash.types';
import { ICashTransaction } from '../../model/transaction.types';
import { CashImportPreviewModalComponent } from '../../smart-ui/import-preview-modal/import-preview-modal.component';
import { CashAccountPage } from './cash-account.page';

// The id both cash factories default to, so a fixture only names the *other*
// account explicitly.
const ACCOUNT_ID = 'cash-account-1';

const CSV_HEADER =
  'Buchungstag;Valuta;Auftraggeber/Beguenstigter;Verwendungszweck;IBAN;BIC;Betrag;Glaeubiger-ID;Mandatsreferenz;Kundenreferenz';
const REWE_ROW =
  '06.01.2026;06.01.2026;REWE Markt GmbH;Einkauf;DE1;GENODEF1;-19,99;;;';
const REWE_TEXT = 'REWE Markt GmbH — Einkauf';
const SALARY_ROW =
  '11.01.2026;11.01.2026;Muster GmbH;Honorar;DE2;MARKDEF1;3.570,00;;;';
// A bank footer line: the date column holds a label, so the parser rejects it.
const UNREADABLE_ROW = 'Anfangssaldo;;;;;;1.000,00;;;';

const csvFile = (...rows: string[]): File =>
  new File([[CSV_HEADER, ...rows].join('\n')], 'umsaetze.csv');

const filePicked = (...files: File[]): Event =>
  ({ target: { files, value: 'umsaetze.csv' } }) as unknown as Event;

const importState = (overrides: Partial<ICashState> = {}): ICashState =>
  mockCashState({
    accounts: [mockCashAccount({ bank: 'volksbank' })],
    rules: [mockCashRule()],
    ...overrides,
  });

interface IPreviewProps {
  transactions: ICashTransaction[];
  duplicates: number;
  rejected: number;
}

describe('CashAccountPage', () => {
  let component: CashAccountPage;
  let create: ReturnType<typeof vi.spyOn>;
  let dispatch: ReturnType<typeof vi.spyOn>;

  const previewProps = (): IPreviewProps =>
    (create.mock.lastCall as unknown as [{ componentProps: IPreviewProps }])[0]
      .componentProps;

  const setup = (state: ICashState) => {
    TestBed.configureTestingModule({
      imports: [CashAccountPage],
      providers: [
        provideTestingProviders({ cash: state }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ accountId: ACCOUNT_ID }),
            },
          },
        },
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

    expect(component.id).toBe(ACCOUNT_ID);
    expect(component.account()?.name).toBe('Giro');
    expect(component.transactions().map((txn) => txn.id)).toEqual([
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

    expect(component.balanceCents()).toBe(8001);
  });

  it('enables the import once the account names a bank with a parser', () => {
    setup(importState());

    expect(component.canImport()).toBe(true);
  });

  it('plans the picked CSV and hands the preview its rows, categorized', async () => {
    setup(importState());

    await component.importCsv(filePicked(csvFile(REWE_ROW, SALARY_ROW)));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ component: CashImportPreviewModalComponent })
    );
    const { transactions, duplicates, rejected } = previewProps();
    expect(transactions).toEqual([
      expect.objectContaining({
        accountId: ACCOUNT_ID,
        dateISO: expect.stringContaining('2026-01-06'),
        amountCents: -1999,
        description: REWE_TEXT,
        source: 'imported',
        status: 'confirmed',
      }),
      expect.objectContaining({ amountCents: 357_000 }),
    ]);
    // The account's rule set has to reach planImport, not just its rows.
    expect(transactions.map((txn) => txn.categoryId)).toEqual([
      'cash-cat-groceries',
      undefined,
    ]);
    expect(duplicates).toBe(0);
    expect(rejected).toBe(0);
  });

  // The batch id is minted once for the file (`uuidv4()`) while the row ids come
  // from the factory (`uuidv4`) — pass the same shape twice and either every row
  // shares one id or every row is its own batch, and both still look imported.
  it('stamps one batch id across the file and a distinct id per row', async () => {
    setup(importState());

    await component.importCsv(filePicked(csvFile(REWE_ROW, SALARY_ROW)));

    const [first, second] = previewProps().transactions;
    expect(first.importBatchId).toEqual(expect.any(String));
    expect(second.importBatchId).toBe(first.importBatchId);
    expect(second.id).not.toBe(first.id);
  });

  it('counts a row already imported into this account as a duplicate', async () => {
    setup(
      importState({
        transactions: [
          mockCashTransaction({
            id: 'already-imported',
            dateISO: '2026-01-06',
            amountCents: -1999,
            description: REWE_TEXT,
            source: 'imported',
          }),
        ],
      })
    );

    await component.importCsv(filePicked(csvFile(REWE_ROW, SALARY_ROW)));

    const { transactions, duplicates } = previewProps();
    expect(transactions.map((txn) => txn.amountCents)).toEqual([357_000]);
    expect(duplicates).toBe(1);
  });

  // A short import reported as a complete one leaves the balance wrong with
  // nothing to notice it by, so the count has to survive the whole composition.
  it('carries unreadable rows through to the preview as rejected', async () => {
    setup(importState());

    await component.importCsv(filePicked(csvFile(REWE_ROW, UNREADABLE_ROW)));

    const { transactions, rejected } = previewProps();
    expect(transactions).toHaveLength(1);
    expect(rejected).toBe(1);
  });

  // A file input keeps its value, so without this the same file re-picked after
  // a cancelled preview fires no change event and the retry looks ignored.
  it('clears the file input so the same file can be picked again', async () => {
    setup(importState());
    const event = filePicked(csvFile(REWE_ROW));

    await component.importCsv(event);

    expect((event.target as HTMLInputElement).value).toBe('');
  });

  it('imports nothing for an account whose bank has no parser', async () => {
    setup(mockCashState({ accounts: [mockCashAccount()] }));

    await component.importCsv(filePicked(csvFile(REWE_ROW)));

    expect(component.canImport()).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('imports nothing when the picker was dismissed without a file', async () => {
    setup(importState());

    await component.importCsv(filePicked());

    expect(create).not.toHaveBeenCalled();
  });

  it('detaches the manual leg a reconciliation absorbed', () => {
    setup(importState());

    component.detachReconcile({
      ...mockCashTransaction(),
      reconciledManualId: 'manual-leg',
    });

    expect(dispatch).toHaveBeenCalledWith(
      CashActions.unreconcileTransaction('manual-leg')
    );
  });

  it('leaves a row that absorbed nothing alone', () => {
    setup(importState());

    component.detachReconcile(mockCashTransaction());

    expect(dispatch).not.toHaveBeenCalled();
  });
});
