import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { CategoryInputComponent } from '../../../@shared/smart-ui/category-input/category-input.component';
import { DateInputComponent } from '../../../@shared/ui/forms/date-input/date-input.component';
import { ItemEditModalComponent } from '../../../@shared/smart-ui/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { ItemDialogsActions } from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditTaskItem } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import { selectTasksListItems } from '../../data/tasks.selector';

@Component({
  selector: 'app-edit-task-item-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    CategoryInputComponent,
    ItemEditModalComponent,
    DateInputComponent,
    NumberInputComponent,
  ],
  templateUrl: './edit-task-item-dialog.component.html',
  styleUrl: './edit-task-item-dialog.component.scss',
})
export class EditTaskItemDialogComponent {
  readonly #store = inject(Store);

  rxItem = this.#store.selectSignal(selectEditTaskItem);
  rxTasksItems = this.#store.selectSignal(selectTasksListItems);

  constructor() {
    addIcons({ closeCircle });
  }

  updatePrio(value: number) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        prio: value,
      })
    );
  }

  updateDueAt(value?: string) {
    this.#store.dispatch(
      ItemDialogsActions.updateItem({
        dueAt: value,
      })
    );
  }
}
