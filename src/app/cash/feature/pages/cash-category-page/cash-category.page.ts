import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { CashFacade } from '../../../data';
import { CashDetailHeaderComponent } from '../../../ui/cash-detail-header/cash-detail-header.component';
import { MoneyEurPipe } from '../../../util/formatting/money.pipe';
import { LocalizedDatePipe } from '../../../util/formatting/localized-date.pipe';

@Component({
  selector: 'app-page-cash-category',
  templateUrl: './cash-category.page.html',
  styleUrls: ['./cash-category.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CashDetailHeaderComponent,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    TranslatePipe,
    MoneyEurPipe,
    LocalizedDatePipe,
  ],
})
export class CashCategoryPage {
  readonly #facade = inject(CashFacade);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly #id = this.#route.snapshot.paramMap.get('categoryId') ?? '';
  readonly transactions = this.#facade.transactionsForCategory(this.#id);
  readonly #categories = this.#facade.categories;
  readonly #accounts = this.#facade.accounts;
  readonly #accountNameById = computed(
    () => new Map(this.#accounts().map((a) => [a.id, a.name]))
  );

  readonly categoryName = computed(
    () => this.#categories().find((c) => c.id === this.#id)?.name ?? ''
  );

  accountName(accountId: string): string {
    return this.#accountNameById().get(accountId) ?? '';
  }

  goBack(): void {
    void this.#router.navigate(['/cash/categories']);
  }

  openAccount(accountId: string): void {
    void this.#router.navigate(['/cash', accountId]);
  }
}
