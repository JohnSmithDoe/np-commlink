/* ─── why ─────────────────────────────────────────────────────────
 * The camt statement is SYNTHESIZED here rather than taken from
 * `docs/cash/` — those fixtures are gitignored real exports, and a
 * handbook screenshot is published. Every IBAN, name and reference below
 * is invented.
 *
 * One test, not five: the import preview is only interesting once rules
 * and schedules already exist, so the whole flow has to run in one
 * context. Playwright gives each test a fresh IndexedDB.
 *
 * The file input carries `hidden`, so `setInputFiles` is the only way in —
 * a click on it would fail actionability.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page, test } from '@playwright/test';
import {
  CREATE_BUTTON,
  addButton,
  createDialog,
  pageRoot,
  pickSelectOption,
  waitForPersisted,
} from '../helpers';
import { shot, shotOf } from './shot';

const IBAN = 'DE00 1234 5678 9012 3456 78';

interface Entry {
  date: string;
  amount: string;
  side: 'DBIT' | 'CRDT';
  status: 'BOOK' | 'PDNG';
  party: string;
  purpose: string;
  ref?: string;
  mandate?: string;
}

const ENTRIES: Entry[] = [
  {
    date: '2026-08-03',
    amount: '940.00',
    side: 'DBIT',
    status: 'BOOK',
    party: 'HAUSVERWALTUNG NORD',
    purpose: 'MIETE 08/2026 WHG 12',
    ref: '20260803000000001',
    mandate: 'HVN-2026-0012',
  },
  {
    date: '2026-08-05',
    amount: '2450.00',
    side: 'CRDT',
    status: 'BOOK',
    party: 'NEONTECH GMBH',
    purpose: 'LOHN AUGUST 2026',
    ref: '20260805000000002',
  },
  {
    date: '2026-08-07',
    amount: '89.90',
    side: 'DBIT',
    status: 'BOOK',
    party: 'STROMWERK NEUSTADT',
    purpose: 'STROM ABSCHLAG AUGUST',
    ref: '20260807000000003',
    mandate: 'SWN-88213',
  },
  {
    date: '2026-08-11',
    amount: '4.20',
    side: 'DBIT',
    status: 'BOOK',
    party: 'SOYKAF KIOSK',
    purpose: 'KARTENZAHLUNG SOYKAF KIOSK',
    ref: '20260811000000004',
  },
  {
    date: '2026-08-12',
    amount: '12.80',
    side: 'DBIT',
    status: 'BOOK',
    party: 'SOYKAF KIOSK',
    purpose: 'KARTENZAHLUNG SOYKAF KIOSK GROSSE TASSE',
  },
  {
    date: '2026-08-18',
    amount: '23.50',
    side: 'DBIT',
    status: 'PDNG',
    party: 'BUCHLADEN AM KANAL',
    purpose: 'KARTENZAHLUNG BUCHLADEN',
  },
];

const CLOSING = '1403.10';

function entryXml(entry: Entry): string {
  const party = entry.side === 'CRDT' ? 'Dbtr' : 'Cdtr';
  return `<Ntry>
    <Amt Ccy="EUR">${entry.amount}</Amt>
    <CdtDbtInd>${entry.side}</CdtDbtInd>
    <Sts><Cd>${entry.status}</Cd></Sts>
    <BookgDt><Dt>${entry.date}</Dt></BookgDt>
    <ValDt><Dt>${entry.date}</Dt></ValDt>
    ${entry.ref ? `<AcctSvcrRef>${entry.ref}</AcctSvcrRef>` : ''}
    <BkTxCd><Domn><Cd>PMNT</Cd></Domn></BkTxCd>
    <NtryDtls><TxDtls>
      <Refs>
        <EndToEndId>NOTPROVIDED</EndToEndId>
        ${entry.mandate ? `<MndtId>${entry.mandate}</MndtId>` : ''}
      </Refs>
      <RltdPties>
        <${party}><Pty><Nm>${entry.party}</Nm></Pty></${party}>
      </RltdPties>
      <RmtInf><Ustrd>${entry.purpose}</Ustrd></RmtInf>
    </TxDtls></NtryDtls>
  </Ntry>`;
}

const STATEMENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
 <BkToCstmrStmt>
  <GrpHdr><MsgId>HANDBUCH-0001</MsgId><CreDtTm>2026-08-19T09:00:00.0+02:00</CreDtTm></GrpHdr>
  <Stmt>
   <Id>2026C08190000000000</Id>
   <CreDtTm>2026-08-19T09:00:00.0+02:00</CreDtTm>
   <Acct><Id><IBAN>${IBAN.replaceAll(' ', '')}</IBAN></Id><Ccy>EUR</Ccy></Acct>
   <Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">0.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Dt><Dt>2026-08-01</Dt></Dt></Bal>
   <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">${CLOSING}</Amt><CdtDbtInd>CRDT</CdtDbtInd><Dt><Dt>2026-08-18</Dt></Dt></Bal>
   ${ENTRIES.map((entry) => entryXml(entry)).join('\n')}
  </Stmt>
 </BkToCstmrStmt>
</Document>`;

function dialog(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

function nameInput(scope: Locator): Locator {
  return scope.getByRole('textbox', { name: 'Name' });
}

function saveButton(scope: Locator): Locator {
  return scope.getByRole('button', { name: /Anlegen|Übernehmen/ });
}

function valueInput(scope: Locator, index: number): Locator {
  return scope.getByTestId('condition-value').nth(index).locator('input');
}

async function pickField(page: Page, scope: Locator, label: string) {
  await scope.getByTestId('condition-field').first().click();
  const popover = page.locator('ion-popover');
  await expect(popover).toBeVisible();
  await popover.getByRole('radio', { name: label }).click();
  await expect(popover).toBeHidden();
}

async function assignCategory(page: Page, scope: Locator, name: string) {
  await scope.getByTestId('category-input-trigger').click();
  const search = page.getByTestId('category-picker-search').locator('input');
  await expect(search).toBeVisible();
  await search.fill(name);
  await page.waitForTimeout(400); // > searchbar debounce (250ms)
  const rows = page.locator('ion-list[role="listbox"] ion-item');
  await expect(rows.first()).toBeVisible();
  const create = page.getByText(`${name} erstellen`);
  const target = (await create.isVisible())
    ? create
    : rows.filter({ hasText: name }).first();
  await target.click();
  await expect(
    scope.locator('app-category-input').getByText(name)
  ).toBeVisible();
}

async function toastGone(page: Page): Promise<void> {
  await expect
    .poll(() => page.locator('ion-toast:not(.overlay-hidden)').count(), {
      timeout: 20_000,
    })
    .toBe(0);
}

async function createAccount(page: Page) {
  await page.goto('/#/cash');
  const accounts = pageRoot(page, 'app-page-cash');
  await expect(accounts).toBeVisible({ timeout: 60_000 });

  await addButton(accounts).click();
  const modal = createDialog(page);
  await nameInput(modal).fill('Girokonto');
  await pickSelectOption(page, modal.getByTestId('account-kind'), 'Girokonto');
  await modal.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(dialog(page)).toBeHidden();
  await waitForPersisted(page, 'cash', 'Girokonto');
}

async function createRule(
  page: Page,
  name: string,
  category: string,
  field: string | undefined,
  value: string
) {
  const rules = pageRoot(page, 'app-page-cash-rules');
  await rules.getByRole('button', { name: 'Regel hinzufügen' }).click();
  const modal = createDialog(page);
  await expect(modal).toBeVisible();
  await nameInput(modal).fill(name);
  await assignCategory(page, modal, category);
  if (field) await pickField(page, modal, field);
  await valueInput(modal, 0).fill(value);
  await expect(saveButton(modal)).toBeEnabled();
  await saveButton(modal).click();
  await expect(dialog(page)).toBeHidden();
  await waitForPersisted(page, 'cash', value);
}

async function createSchedule(
  page: Page,
  name: string,
  amount: string,
  category: string,
  field: string | undefined,
  value: string
) {
  const schedules = pageRoot(page, 'app-page-cash-schedules');
  await schedules
    .getByRole('button', { name: 'Festkosten hinzufügen' })
    .click();
  const modal = createDialog(page);
  await expect(modal).toBeVisible();
  await nameInput(modal).fill(name);
  await modal.locator('app-money-input input').fill(amount);
  await assignCategory(page, modal, category);
  if (field) await pickField(page, modal, field);
  await valueInput(modal, 0).fill(value);
  await expect(saveButton(modal)).toBeEnabled();
  await saveButton(modal).click();
  await expect(dialog(page)).toBeHidden();
  await waitForPersisted(page, 'cash', name);
}

test.describe('handbook · credstick import', () => {
  test('statement import, rules and schedules', async ({ page }) => {
    test.setTimeout(600_000);

    await createAccount(page);

    await page.goto('/#/cash/rules');
    await expect(pageRoot(page, 'app-page-cash-rules')).toBeVisible({
      timeout: 60_000,
    });
    await createRule(page, 'Miete', 'Wohnen', undefined, 'HAUSVERWALTUNG');
    await createRule(page, 'Strom', 'Energie', 'Zahlungspartner', 'STROMWERK');
    await createRule(page, 'Soykaf', 'Kaffee', undefined, 'SOYKAF');

    await page.goto('/#/cash/schedules');
    await expect(pageRoot(page, 'app-page-cash-schedules')).toBeVisible({
      timeout: 60_000,
    });
    await createSchedule(
      page,
      'Miete',
      '900,00',
      'Wohnen',
      undefined,
      'HAUSVERWALTUNG'
    );
    await createSchedule(
      page,
      'Strom',
      '89,90',
      'Energie',
      'Zahlungspartner',
      'STROMWERK'
    );

    await page.goto('/#/cash');
    const accounts = pageRoot(page, 'app-page-cash');
    await expect(accounts).toBeVisible({ timeout: 60_000 });
    await accounts.getByText('Girokonto').first().click();
    const account = pageRoot(page, 'app-page-cash-account');
    await expect(account).toBeVisible();
    await page.locator('#statement-input').setInputFiles({
      name: 'kontoauszug-2026-08.xml',
      mimeType: 'application/xml',
      buffer: Buffer.from(STATEMENT_XML, 'utf8'),
    });
    const preview = dialog(page).filter({
      hasText: 'Kontoauszug importieren',
    });
    await expect(preview).toBeVisible({ timeout: 60_000 });
    await expect(preview.getByText('HAUSVERWALTUNG NORD')).toBeVisible();
    await shot(page, 'credstick-import-preview');

    await preview.getByRole('button', { name: 'Importieren' }).click();
    await expect(dialog(page)).toBeHidden({ timeout: 30_000 });
    await waitForPersisted(page, 'cash', 'SOYKAF KIOSK');
    await expect(account.getByText('STROMWERK NEUSTADT')).toBeVisible();
    await toastGone(page);
    await shot(page, 'credstick-import-ledger');
    await shotOf(account.locator('app-page-header'), 'credstick-import-entry');

    await page.goto('/#/cash/rules');
    const rules = pageRoot(page, 'app-page-cash-rules');
    await expect(rules).toBeVisible({ timeout: 60_000 });
    await expect(rules.getByTestId('cash-rule-row')).toHaveCount(3);
    await toastGone(page);
    await shot(page, 'credstick-import-rules');

    const row = rules.locator('ion-item-sliding').first();
    await row.evaluate(
      (element: HTMLElement & { open(side: string): Promise<void> }) =>
        element.open('end')
    );
    await shot(page, 'credstick-import-rule-swipe');
    await row.evaluate((element: HTMLElement & { close(): Promise<void> }) =>
      element.close()
    );

    await rules.getByTestId('cash-rule-row').nth(1).click();
    const ruleDialog = page
      .locator('ion-modal.show-modal')
      .filter({ hasText: 'Eintrag bearbeiten' });
    await expect(ruleDialog).toBeVisible();
    await expect(ruleDialog.getByTestId('match-preview')).toBeVisible();
    await shot(page, 'credstick-import-rule-dialog');
    await ruleDialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog(page)).toBeHidden();

    await page.goto('/#/cash/schedules');
    const schedules = pageRoot(page, 'app-page-cash-schedules');
    await expect(schedules).toBeVisible({ timeout: 60_000 });
    await expect(schedules.getByTestId('cash-schedule-row')).toHaveCount(2);
    await shot(page, 'credstick-import-schedules');
  });
});
