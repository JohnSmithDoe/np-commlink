import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TItemListCategory } from '../../../@shared/types';
import { ITaskItem } from '../../model';
import { CategoriesDialogComponent } from '../../../@shared/ui/categories-dialog/categories-dialog.component';
import { CategoryInputComponent } from '../../../@shared/ui/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import {
  selectEditTaskItem,
  selectTasksCategories,
  selectTasksListItems,
  TasksActions,
} from '../../data';

/**
 * Task edit-dialog wrapper (type:feature). Same pattern as the grocery
 * wrappers, in the sealed `tasks` domain: reads the shared open-command, owns
 * the edit draft locally, saves via `TasksActions.addOrUpdateItem` on confirm,
 * handles categories against the tasks slice (dialog refactor stage 4).
 */
@Component({
  selector: 'app-edit-task-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CategoryInputComponent,
    CategoriesDialogComponent,
    ItemEditModalComponent,
    DateInputComponent,
    NumberInputComponent,
  ],
  templateUrl: './edit-task-item-dialog.component.html',
  styleUrl: './edit-task-item-dialog.component.scss',
})
export class EditTaskItemDialogComponent {
  readonly #store = inject(Store);

  readonly #open = this.#store.selectSignal(selectEditState);
  readonly seedItem = this.#store.selectSignal(selectEditTaskItem);
  readonly categories = this.#store.selectSignal(selectTasksCategories);
  readonly listItems = this.#store.selectSignal(selectTasksListItems);

  readonly isOpen = computed(
    () => this.#open().isEditing === true && this.#open().listId === '_tasks'
  );
  readonly saveButtonText = computed(() => this.#open().saveButtonText ?? '');
  readonly dialogTitle = computed(() => this.#open().dialogTitle ?? '');

  readonly draft = linkedSignal<ITaskItem | undefined>(() => {
    const item = this.seedItem();
    return item ? { ...item } : undefined;
  });

  readonly categoriesDialogOpen = signal(false);

  constructor() {
    addIcons({ closeCircle });
  }

  #patch(partial: Partial<ITaskItem>) {
    this.draft.update((draft) => (draft ? { ...draft, ...partial } : draft));
  }

  updateName(name: string) {
    this.#patch({ name });
  }

  updatePrio(value: number) {
    this.#patch({ prio: value });
  }

  updateDueAt(value?: string) {
    this.#patch({ dueAt: value });
  }

  removeCategory(category: TItemListCategory) {
    this.#patch({
      category: (this.draft()?.category ?? []).filter((c) => c !== category),
    });
  }

  openCategoriesDialog() {
    this.categoriesDialogOpen.set(true);
  }

  confirmCategories(selection: TItemListCategory[]) {
    this.#patch({ category: selection });
    this.categoriesDialogOpen.set(false);
  }

  cancelCategories() {
    this.categoriesDialogOpen.set(false);
  }

  addCategory(category: TItemListCategory) {
    this.#store.dispatch(TasksActions.addCategory(category));
  }

  confirm() {
    const draft = this.draft();
    if (draft) {
      this.#store.dispatch(TasksActions.addOrUpdateItem(draft));
    }
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }

  close() {
    this.#store.dispatch(ItemDialogsActions.hideDialog());
  }
}
