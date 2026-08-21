/* ─── why ─────────────────────────────────────────────────────────
 * The one cash surface that does NOT render `ListPageComponent`, kept out
 * by the reorder handle: `ion-reorder-group` must be an ancestor of every
 * `ion-reorder`, and the shared list owns the element rows project into.
 * Opening a seam there for one caller is what this refactor removes.
 *
 * It would also gain least. A rules list is not sorted, it is ARRANGED —
 * `categorize` returns the first match — so a sort toolbar over it offers
 * to silently change what the rules mean.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { CashRule } from '../../model/rule.types';
import {
  CashCategoriesFacade,
  CashRulesFacade,
  CashTransactionsFacade,
} from '../../data';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { recategorizations } from '../../util/categorize.utils';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { EditCashRuleDialogComponent } from '../edit-cash-rule-dialog/edit-cash-rule-dialog.component';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';
import { reorderedIds } from '../../../@shared/util/app.utils';

import { CategoryId } from '../../../@shared/model/category.types';
import { Marker } from '../../../@shared/model/app.types';

@Component({
  selector: 'app-page-cash-rules',
  templateUrl: './cash-rules.page.html',
  styleUrls: ['./cash-rules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EditCashRuleDialogComponent,
    PageHeaderComponent,
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
    RouterLink,
    TranslatePipe,
  ],
})
export class CashRulesPage {
  readonly #facade = inject(CashRulesFacade);
  readonly #transactionsFacade = inject(CashTransactionsFacade);
  readonly #categoriesFacade = inject(CashCategoriesFacade);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly categories = this.#categoriesFacade.allItems;
  readonly #rules = this.#facade.allItems;
  readonly #transactions = this.#transactionsFacade.allItems;

  readonly #categoryName = computed(() =>
    categoryNameLookup(this.categories())
  );

  readonly rules = computed(() =>
    this.#rules().toSorted((a, b) => a.order - b.order)
  );

  readonly #stats = this.#facade.stats;

  statLabelKey(rule: CashRule): Marker {
    const stat = this.#stats()[rule.id];
    if (!stat || stat.matched === 0) return marker('cash.rule.dead');
    return stat.claimed === 0
      ? marker('cash.rule.shadowed')
      : marker('cash.rule.claims');
  }

  claimed(rule: CashRule): number {
    return this.#stats()[rule.id]?.claimed ?? 0;
  }

  inert(rule: CashRule): boolean {
    return this.claimed(rule) === 0;
  }

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

  conditionSummaryLabel(rule: CashRule): string {
    const key =
      rule.match === 'all'
        ? marker('cash.rule.summary-all')
        : marker('cash.rule.summary-any');
    return this.#translate.instant(key, { count: rule.conditions.length });
  }

  reorder(event: ReorderEndCustomEvent): void {
    this.#facade.reorder(reorderedIds(event, this.rules()));
  }

  openNewRule(): void {
    this.#facade.showCreateDialog();
  }

  openEditRule(rule: CashRule): void {
    this.#facade.showEditDialog(rule);
  }

  async confirmDeleteRule(rule: CashRule): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.rule.delete.header'),
        messageKey: marker('cash.rule.delete.message'),
        messageParams: {
          name: rule.name || this.categoryName(rule.categoryId),
        },
        onConfirm: () => this.#facade.removeItem(rule),
      })
    );
    await alert.present();
  }

  applyRules(): void {
    const changes = recategorizations(this.#transactions(), this.#rules());
    if (changes.length > 0) {
      this.#transactionsFacade.recategorize(changes);
    }
    this.#facade.reportRulesApplied(changes.length);
  }
}
