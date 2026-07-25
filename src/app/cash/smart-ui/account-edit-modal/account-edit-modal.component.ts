import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import dayjs from 'dayjs';
import { ICashAccount, TAccountKind, TBank } from '../../model';
import { uuidv4 } from '../../../@shared/util/app.utils';
import { CashFacade } from '../../data';
import { centsToInput, eurToCents } from '../../util/money';
import { BANK_OPTIONS } from '../../util/import/bank-parsers';

const ACCOUNT_KINDS: readonly TAccountKind[] = [
  'giro',
  'creditcard',
  'savings',
  'cash',
];

// Rendered dynamically ('cash.account.kind.' + k, 'cash.bank.' + b | translate),
// so the extractor can't see them — register each concrete key explicitly.
marker('cash.account.kind.giro');
marker('cash.account.kind.creditcard');
marker('cash.account.kind.savings');
marker('cash.account.kind.cash');
marker('cash.bank.volksbank');
marker('cash.bank.dkb');

/**
 * Create/edit a cash account, presented via `ModalController`. `accountId` is an
 * imperative componentProp (Ionic assigns it before `ngOnInit`): undefined =
 * create, otherwise edit that account. Local signal state is seeded once from
 * the store; confirm dispatches add/update and dismisses. The opening balance is
 * edited as a raw de-DE string and parsed by `eurToCents` on save.
 */
@Component({
  selector: 'app-cash-account-edit-modal',
  templateUrl: './account-edit-modal.component.html',
  styleUrls: ['./account-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonNote,
    IonSelect,
    IonSelectOption,
    TranslateModule,
  ],
})
export class CashAccountEditModalComponent implements OnInit {
  readonly #facade = inject(CashFacade);
  readonly #modalCtrl = inject(ModalController);
  readonly #accounts = this.#facade.accounts;

  /** Set imperatively via `componentProps`; undefined = create mode. */
  accountId?: string;

  readonly kinds = ACCOUNT_KINDS;
  readonly banks = BANK_OPTIONS;

  readonly name = signal('');
  readonly kind = signal<TAccountKind>('giro');
  // '' = no bank (manual-only account, no CSV import).
  readonly bank = signal<TBank | ''>('');
  // Opening balance is edited as a raw string and parsed on save.
  readonly openingBalance = signal('');
  readonly openingDate = signal(dayjs().format('YYYY-MM-DD'));

  readonly isEdit = computed(() => !!this.accountId);
  readonly #parsedCents = computed(() => eurToCents(this.openingBalance()));
  // Empty is allowed and means "0"; otherwise it must parse.
  readonly balanceInvalid = computed(
    () => this.openingBalance().trim() !== '' && this.#parsedCents() === null
  );
  readonly canSave = computed(
    () => this.name().trim().length > 0 && !this.balanceInvalid()
  );

  ngOnInit(): void {
    const existing = this.#existing();
    if (!existing) return;
    this.name.set(existing.name);
    this.kind.set(existing.kind);
    this.bank.set(existing.bank ?? '');
    this.openingBalance.set(
      existing.openingBalanceCents === 0
        ? ''
        : centsToInput(existing.openingBalanceCents)
    );
    this.openingDate.set(dayjs(existing.openingDateISO).format('YYYY-MM-DD'));
  }

  onName(value: string): void {
    this.name.set(value);
  }

  onKind(value: TAccountKind): void {
    this.kind.set(value);
  }

  onBank(value: TBank | ''): void {
    this.bank.set(value);
  }

  onBalance(value: string): void {
    this.openingBalance.set(value);
  }

  onDate(value: string): void {
    this.openingDate.set(value);
  }

  save(): void {
    if (!this.canSave()) return;
    const existing = this.#existing();
    const openingBalanceCents = this.#parsedCents() ?? 0;
    const openingDateISO = dayjs(this.openingDate()).format();
    const bank = this.bank() || undefined;

    if (existing) {
      this.#facade.updateAccount({
        ...existing,
        name: this.name().trim(),
        kind: this.kind(),
        bank,
        openingBalanceCents,
        openingDateISO,
      });
    } else {
      const account: ICashAccount = {
        id: uuidv4(),
        name: this.name().trim(),
        kind: this.kind(),
        bank,
        openingBalanceCents,
        openingDateISO,
        createdAt: dayjs().format(),
      };
      this.#facade.addAccount(account);
    }
    void this.#modalCtrl.dismiss();
  }

  cancel(): void {
    void this.#modalCtrl.dismiss();
  }

  #existing(): ICashAccount | undefined {
    return this.accountId
      ? this.#accounts().find((a) => a.id === this.accountId)
      : undefined;
  }
}
