import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { IonToggle } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BaseCategoryEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import {
  TaskAnchor,
  TaskItem,
  TaskLead,
  TASKS_LIST_ID,
} from '../../model/task.types';
import { createTaskItem } from '../../util/task.factory';
import { ANCHOR_OPTIONS } from '../../util/task-anchor.utils';
import { leadOptionsFor, ON_DAY_LEAD } from '../../util/task-lead.utils';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/categories/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { DateShortcutsComponent } from '../../../@shared/ui/forms/date-shortcuts/date-shortcuts.component';
import { IntervalInputComponent } from '../../../@shared/ui/forms/interval-input/interval-input.component';
import {
  ChipOption,
  OptionChipsComponent,
} from '../../../@shared/ui/forms/option-chips/option-chips.component';
import {
  Interval,
  isCalendarInterval,
} from '../../../@shared/model/interval.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberSelectComponent } from '../../../@shared/ui/forms/number-select/number-select.component';
import { TasksListPageFacade } from '../../data';
import { Category, CategoryId } from '../../../@shared/model/category.types';

@Component({
  selector: 'app-edit-task-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonToggle,
    TranslatePipe,
    CategoryInputComponent,
    CategoriesDialogComponent,
    ItemEditModalComponent,
    DateInputComponent,
    DateShortcutsComponent,
    IntervalInputComponent,
    NumberSelectComponent,
    OptionChipsComponent,
  ],
  templateUrl: './edit-task-item-dialog.component.html',
})
export class EditTaskItemDialogComponent extends BaseCategoryEditItemDialog<TaskItem> {
  protected blank(): TaskItem {
    return createTaskItem('');
  }

  protected override toForm(item: TaskItem): TaskItem {
    return { ...item, closings: undefined };
  }

  protected override fromForm(draft: TaskItem, seed: TaskItem): TaskItem {
    return { ...seed, ...draft, closings: seed.closings };
  }

  readonly #facade = inject(TasksListPageFacade);
  readonly #translate = inject(TranslateService);
  protected readonly listId = TASKS_LIST_ID;
  readonly categories = this.#facade.catalog;
  readonly siblings = this.#facade.allItems;

  readonly onDayLead = ON_DAY_LEAD;

  readonly anchorOptions = computed<ChipOption<TaskAnchor>[]>(() =>
    ANCHOR_OPTIONS.map((anchor) => ({
      value: anchor.value,
      label: this.#translate.instant(anchor.key),
    }))
  );

  readonly anchorChoice = computed(() => {
    const { interval, dueAt } = this.draft();
    return !!dueAt && !!interval && !isCalendarInterval(interval);
  });

  readonly leadOptions = computed<ChipOption<TaskLead>[]>(() => {
    const interval = this.draft().interval;
    if (!interval) return [];
    return leadOptionsFor(interval).map((option) => ({
      value: option.lead,
      label: this.#translate.instant(option.key, option.params),
    }));
  });

  protected save(item: TaskItem): void {
    this.#facade.saveItem(item);
  }
  protected addCategoryToCatalog(category: Category): void {
    this.#facade.addCategory(category);
  }
  protected removeCategoryFromCatalog(categoryId: CategoryId): void {
    this.#facade.removeCategory(categoryId);
  }
  protected renameCategoryInCatalog(id: CategoryId, to: string): void {
    this.#facade.renameCategory(id, to);
  }

  updatePrio(value: number | undefined) {
    this.patch({ prio: value });
  }

  updateDueAt(value: string) {
    this.patch({ dueAt: value || undefined, nextDueAt: value || undefined });
  }

  updateInterval(interval: Interval | undefined) {
    this.patch({ interval, lead: undefined, nextDueAt: this.draft().dueAt });
  }

  updateAnchor(anchor: TaskAnchor) {
    this.patch({ anchor });
  }

  updateLead(lead: TaskLead) {
    this.patch({ lead });
  }

  updateDone(done: boolean) {
    this.patch({
      doneAt: done
        ? (this.draft().doneAt ?? new Date().toISOString())
        : undefined,
    });
  }
}
