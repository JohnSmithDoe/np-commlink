/* ─── why ─────────────────────────────────────────────────────────
 * A rules list is not sorted, it is ARRANGED — `categorize` returns the
 * first match — so the facade declares no sort command and the shared
 * toolbar never renders. Its `items` are ordered by `order`, which is
 * also what a drag reports back.
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
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addIcons } from 'ionicons';
import { add, playOutline, pricetagsOutline, remove } from 'ionicons/icons';
import { CashRule } from '../../model/rule.types';
import {
  CashCategoriesFacade,
  CashRulesFacade,
  CashTransactionsFacade,
} from '../../data';
import { deleteConfirmAlert } from '../../util/delete-alert.utils';
import { recategorizations } from '../../util/categorize.utils';
import { ListPageComponent } from '../../../@shared/feature/item-lists/list-page/list-page.component';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { LIST_FACADE } from '../../../@shared/util/item-lists/list-page.facade';
import { categoryNameLookup } from '../../../@shared/util/categories/category.utils';

import { CategoryId } from '../../../@shared/model/category.types';
import { Marker } from '../../../@shared/model/app.types';

@Component({
  selector: 'app-page-cash-rules',
  templateUrl: './cash-rules.page.html',
  styleUrls: ['./cash-rules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListPageComponent,
    ListItemComponent,
    IonButtons,
    IonButton,
    IonIcon,
    RouterLink,
    TranslatePipe,
  ],
  providers: [{ provide: LIST_FACADE, useExisting: CashRulesFacade }],
})
export class CashRulesPage {
  readonly facade = inject(CashRulesFacade);
  readonly #transactionsFacade = inject(CashTransactionsFacade);
  readonly #categoriesFacade = inject(CashCategoriesFacade);
  readonly #alertCtrl = inject(AlertController);
  readonly #translate = inject(TranslateService);

  readonly categories = this.#categoriesFacade.allItems;

  readonly #categoryName = computed(() =>
    categoryNameLookup(this.categories())
  );

  readonly #stats = this.facade.stats;

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
    addIcons({ add, remove, playOutline, pricetagsOutline });
  }

  conditionSummaryLabel(rule: CashRule): string {
    const key =
      rule.match === 'all'
        ? marker('cash.rule.summary-all')
        : marker('cash.rule.summary-any');
    return this.#translate.instant(key, { count: rule.conditions.length });
  }

  openEditRule(rule: CashRule): void {
    this.facade.showEditDialog(rule);
  }

  async confirmDeleteRule(rule: CashRule): Promise<void> {
    const alert = await this.#alertCtrl.create(
      deleteConfirmAlert(this.#translate, {
        headerKey: marker('cash.rule.delete.header'),
        messageKey: marker('cash.rule.delete.message'),
        messageParams: {
          name: rule.name || this.categoryName(rule.categoryId),
        },
        onConfirm: () => this.facade.removeItem(rule),
      })
    );
    await alert.present();
  }

  applyRules(): void {
    const changes = recategorizations(
      this.#transactionsFacade.allItems(),
      this.facade.allItems()
    );
    if (changes.length > 0) {
      this.#transactionsFacade.recategorize(changes);
    }
    this.facade.reportRulesApplied(changes.length);
  }
}
