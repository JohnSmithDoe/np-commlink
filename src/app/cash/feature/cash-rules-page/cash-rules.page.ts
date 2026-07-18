import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  arrowDownOutline,
  arrowUpOutline,
  playOutline,
  trashOutline,
} from 'ionicons/icons';
import { ICashRule } from '../../model';
import {
  CashActions,
  selectCashCategories,
  selectCashRules,
  selectCashTransactions,
} from '../../data';
import { categorize } from '../../util/categorize';
import { CashRuleEditModalComponent } from '../../smart-ui/rule-edit-modal/rule-edit-modal.component';

/**
 * Categories + categorization rules. The category palette (add/remove) feeds the
 * rule editor's category picker. Rules are shown in priority order with up/down
 * controls (→ `reorderRules`), tap-to-edit, swipe-to-delete. "Apply rules" runs
 * the pure `categorize` engine over every non-manual transaction and reports how
 * many changed. Reached from the accounts overview header.
 */
@Component({
  selector: 'app-page-cash-rules',
  templateUrl: './cash-rules.page.html',
  styleUrls: ['./cash-rules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonIcon,
    IonInput,
    IonNote,
    TranslateModule,
  ],
})
export class CashRulesPage {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #toastCtrl = inject(ToastController);
  readonly #translate = inject(TranslateService);

  readonly categories = this.#store.selectSignal(selectCashCategories);
  readonly #rules = this.#store.selectSignal(selectCashRules);
  readonly #transactions = this.#store.selectSignal(selectCashTransactions);

  readonly rules = computed(() =>
    [...this.#rules()].sort((a, b) => a.order - b.order)
  );

  readonly newCategory = signal('');
  readonly canAddCategory = computed(() => {
    const name = this.newCategory().trim();
    return name.length > 0 && !this.categories().includes(name);
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      addOutline,
      trashOutline,
      arrowUpOutline,
      arrowDownOutline,
      playOutline,
    });
  }

  goBack(): void {
    void this.#router.navigate(['/cash']);
  }

  onNewCategory(value: string): void {
    this.newCategory.set(value);
  }

  addCategory(): void {
    if (!this.canAddCategory()) return;
    this.#store.dispatch(CashActions.addCategory(this.newCategory().trim()));
    this.newCategory.set('');
  }

  removeCategory(category: string): void {
    this.#store.dispatch(CashActions.removeCategory(category));
  }

  summarize(rule: ICashRule): string {
    const n = rule.conditions.length;
    const key =
      rule.match === 'all' ? 'cash.rule.summary-all' : 'cash.rule.summary-any';
    return this.#translate.instant(key, { count: n });
  }

  moveRule(rule: ICashRule, direction: -1 | 1): void {
    const sorted = this.rules();
    const i = sorted.findIndex((r) => r.id === rule.id);
    const j = i + direction;
    if (j < 0 || j >= sorted.length) return;
    const ids = sorted.map((r) => r.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    this.#store.dispatch(CashActions.reorderRules(ids));
  }

  async openNewRule(): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashRuleEditModalComponent,
    });
    await modal.present();
  }

  async openEditRule(rule: ICashRule): Promise<void> {
    const modal = await this.#modalCtrl.create({
      component: CashRuleEditModalComponent,
      componentProps: { ruleId: rule.id },
    });
    await modal.present();
  }

  async confirmDeleteRule(rule: ICashRule): Promise<void> {
    const alert = await this.#alertCtrl.create({
      header: this.#translate.instant(marker('cash.rule.delete.header')),
      message: this.#translate.instant(marker('cash.rule.delete.message'), {
        name: rule.name || rule.category,
      }),
      buttons: [
        {
          text: this.#translate.instant(marker('cash.action.cancel')),
          role: 'cancel',
        },
        {
          text: this.#translate.instant(marker('cash.action.delete')),
          role: 'destructive',
          handler: () => this.#store.dispatch(CashActions.removeRule(rule.id)),
        },
      ],
    });
    await alert.present();
  }

  async applyRules(): Promise<void> {
    const rules = this.#rules();
    let changed = 0;
    for (const txn of this.#transactions()) {
      if (txn.categoryManual) continue; // manual override is shielded
      const category = categorize(txn, rules);
      if (category !== txn.category) {
        this.#store.dispatch(
          CashActions.setTransactionCategory(txn.id, category, false)
        );
        changed++;
      }
    }
    const toast = await this.#toastCtrl.create({
      message: this.#translate.instant(marker('cash.rules.apply-result'), {
        count: changed,
      }),
      duration: 2000,
      color: 'medium',
    });
    await toast.present();
  }
}
