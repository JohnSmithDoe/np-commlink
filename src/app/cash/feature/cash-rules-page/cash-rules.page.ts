import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
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
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  arrowDownOutline,
  arrowUpOutline,
  playOutline,
  pricetagsOutline,
  trashOutline,
} from 'ionicons/icons';
import { ICashRule } from '../../model/rule.types';
import { CashFacade } from '../../data';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { recategorizations } from '../../util/categorize.utils';
import { CashRuleEditModalComponent } from '../rule-edit-modal/rule-edit-modal.component';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { presentModal } from '../../../@shared/util/present-modal';

import { TCategoryId } from '../../../@shared/model/category.types';

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
    IonNote,
    TranslateModule,
  ],
})
export class CashRulesPage {
  readonly #facade = inject(CashFacade);
  readonly #router = inject(Router);
  readonly #modalCtrl = inject(ModalController);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly categories = this.#facade.categories;
  readonly #rules = this.#facade.rules;
  readonly #transactions = this.#facade.transactions;

  // id → name lookup so rule rows can render their assigned category's name.
  readonly #categoryName = computed(() =>
    categoryNameLookup(this.categories())
  );

  readonly rules = computed(() =>
    this.#rules().toSorted((a, b) => a.order - b.order)
  );

  categoryName(id: TCategoryId): string {
    return this.#categoryName()(id);
  }

  constructor() {
    addIcons({
      arrowBackOutline,
      addOutline,
      trashOutline,
      arrowUpOutline,
      arrowDownOutline,
      playOutline,
      pricetagsOutline,
    });
  }

  goBack(): void {
    void this.#router.navigate(['/cash']);
  }

  goToCategories(): void {
    void this.#router.navigate(['/cash/categories']);
  }

  conditionSummaryLabel(rule: ICashRule): string {
    const key =
      rule.match === 'all'
        ? marker('cash.rule.summary-all')
        : marker('cash.rule.summary-any');
    return this.#translate.instant(key, { count: rule.conditions.length });
  }

  moveRule(rule: ICashRule, direction: -1 | 1): void {
    const sorted = this.rules();
    const index = sorted.findIndex((candidate) => candidate.id === rule.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const ids = sorted.map((candidate) => candidate.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    this.#facade.reorderRules(ids);
  }

  async openNewRule(): Promise<void> {
    await presentModal(this.#modalCtrl, CashRuleEditModalComponent);
  }

  async openEditRule(rule: ICashRule): Promise<void> {
    await presentModal(this.#modalCtrl, CashRuleEditModalComponent, {
      ruleId: rule.id,
    });
  }

  async confirmDeleteRule(rule: ICashRule): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.rule.delete.header'),
        messageKey: marker('cash.rule.delete.message'),
        messageParams: {
          name: rule.name || this.categoryName(rule.categoryId),
        },
        onConfirm: () => this.#facade.removeRule(rule.id),
      })
    );
    await alert.present();
  }

  applyRules(): void {
    const changes = recategorizations(this.#transactions(), this.#rules());
    for (const change of changes) {
      this.#facade.setTransactionCategory(
        change.transactionId,
        change.categoryId,
        false
      );
    }
    this.#facade.reportRulesApplied(changes.length);
  }
}
