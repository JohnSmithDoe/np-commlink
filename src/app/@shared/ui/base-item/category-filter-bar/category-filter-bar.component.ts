/* ─── why ─────────────────────────────────────────────────────────
 * `ion-chip` is the obvious element and the wrong one: it renders a bare
 * shadow host with a slot and no role, so it takes no focus, answers no
 * key, and `aria-pressed` on it would sit where ARIA prohibits it. These
 * are toggles, so they are `ion-button`s wearing a chip's shape.
 *
 * The active chip is also the clear, which is why there is no separate ×.
 * Arming and clearing stay two outputs because they are two actions
 * upstream — the domain sets its own `filterBy`, while clearing is shared
 * and also strips `?filter=`.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { Category, CategoryId } from '../../../model/category.types';
import { ItemFilter } from '../../../util/item-lists/list-filter';

@Component({
  selector: 'app-category-filter-bar',
  templateUrl: 'category-filter-bar.component.html',
  styleUrls: ['category-filter-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, TranslatePipe],
})
export class CategoryFilterBarComponent {
  readonly catalog = input<readonly Category[]>([]);
  readonly extraFilters = input<readonly ItemFilter[]>([]);
  readonly active = input<CategoryId>();

  readonly selectCategory = output<CategoryId>();
  readonly clearFilter = output<void>();

  isActive(id: CategoryId): boolean {
    return this.active() === id;
  }

  toggle(id: CategoryId): void {
    if (this.isActive(id)) {
      this.clearFilter.emit();
      return;
    }
    this.selectCategory.emit(id);
  }
}
