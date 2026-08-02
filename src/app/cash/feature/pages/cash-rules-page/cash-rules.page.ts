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
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonReorder,
  IonReorderGroup,
  ModalController,
  ReorderEndCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import {
  addOutline,
  playOutline,
  pricetagsOutline,
  trashOutline,
} from 'ionicons/icons';
import { CashRule } from '../../../model/rule.types';
import { CashFacade } from '../../../data';
import { deleteConfirmAlert } from '../../../util/delete-alert.utils';
import { recategorizations } from '../../../util/categorize.utils';
import { CashDetailHeaderComponent } from '../../../ui/cash-detail-header/cash-detail-header.component';
import { CashRuleEditModalComponent } from '../../modals/rule-edit-modal/rule-edit-modal.component';
import { categoryNameLookup } from '../../../../@shared/util/categories/category.utils';
import { reorderedIds } from '../../../../@shared/util/app.utils';
import { presentModal } from '../../../../@shared/util/app.modal.utils';

import { CategoryId } from '../../../../@shared/model/category.types';

@Component({
  selector: 'app-page-cash-rules',
  templateUrl: './cash-rules.page.html',
  styleUrls: ['./cash-rules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CashDetailHeaderComponent,
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
    IonReorder,
    IonReorderGroup,
    TranslatePipe,
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

  readonly #categoryName = computed(() =>
    categoryNameLookup(this.categories())
  );

  readonly rules = computed(() =>
    this.#rules().toSorted((a, b) => a.order - b.order)
  );

  categoryName(id: CategoryId): string {
    return this.#categoryName()(id);
  }

  constructor() {
    addIcons({
      addOutline,
      trashOutline,
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

  conditionSummaryLabel(rule: CashRule): string {
    const key =
      rule.match === 'all'
        ? marker('cash.rule.summary-all')
        : marker('cash.rule.summary-any');
    return this.#translate.instant(key, { count: rule.conditions.length });
  }

  reorder(event: ReorderEndCustomEvent): void {
    this.#facade.reorderRules(reorderedIds(event, this.rules()));
  }

  async openNewRule(): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashRuleEditModalComponent,
      this.#translate.instant(marker('cash.rule-dialog.title-new'))
    );
  }

  async openEditRule(rule: CashRule): Promise<void> {
    await presentModal(
      this.#modalCtrl,
      CashRuleEditModalComponent,
      this.#translate.instant(marker('cash.rule-dialog.title-edit')),
      { ruleId: rule.id }
    );
  }

  async confirmDeleteRule(rule: CashRule): Promise<void> {
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
    if (changes.length > 0) {
      this.#facade.recategorizeTransactions(changes);
    }
    this.#facade.reportRulesApplied(changes.length);
  }
}
