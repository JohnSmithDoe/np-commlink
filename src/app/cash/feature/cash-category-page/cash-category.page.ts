import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { CashFacade } from '../../data';
import { MoneyEurPipe } from '../../util/money.pipe';

/**
 * Category→items drill for cash: the (read-only) list of transactions carrying
 * a category, reached from the shared manage-categories page. Cash has no
 * `filterBy` list like grocery/tasks, so this is its equivalent filtered view.
 * Tap a row to jump to that transaction's account ledger.
 */
@Component({
  selector: 'app-page-cash-category',
  templateUrl: './cash-category.page.html',
  styleUrls: ['./cash-category.page.scss'],
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
    IonLabel,
    IonIcon,
    IonNote,
    TranslateModule,
    MoneyEurPipe,
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

  constructor() {
    addIcons({ arrowBackOutline });
  }

  accountName(accountId: string): string {
    return this.#accountNameById().get(accountId) ?? '';
  }

  formatDate(iso: string): string {
    return dayjs(iso).format('DD.MM.YYYY');
  }

  goBack(): void {
    void this.#router.navigate(['/cash/categories']);
  }

  openAccount(accountId: string): void {
    void this.#router.navigate(['/cash', accountId]);
  }
}
