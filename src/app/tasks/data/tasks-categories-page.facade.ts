import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { uuidv4 } from '../../@shared/util/app.utils';
import { ICategoriesPageFacade } from '../../@shared/util/categories/categories-page.facade';
import { listCategoriesWithCount } from '../../@shared/util/list/list.selector';
import { TasksActions } from './actions/tasks.actions';
import { selectTasksState } from './selectors/tasks.selector';

import { TCategoryId } from '../../@shared/model/category.types';

/**
 * {@link ICategoriesPageFacade} for the single `_tasks` list. Reads the tasks
 * slice through the tasks-domain selectors and dispatches only `TasksActions`,
 * mirroring {@link TasksListPageFacade} — this is what seals `tasks` off the
 * grocery domain on the manage surface too.
 */
@Injectable({ providedIn: 'root' })
export class TasksCategoriesPageFacade implements ICategoriesPageFacade {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #state = this.#store.selectSignal(selectTasksState);

  readonly categories = computed(() => listCategoriesWithCount(this.#state()));
  readonly listTitleKey = signal('page-title.tasks');
  readonly listHref = signal('/tasks/list');

  add(name: string): void {
    this.#store.dispatch(TasksActions.addCategory({ id: uuidv4(), name }));
  }

  rename(id: TCategoryId, name: string): void {
    this.#store.dispatch(TasksActions.updateCategory(id, name));
  }

  remove(id: TCategoryId): void {
    this.#store.dispatch(TasksActions.removeCategory(id));
  }

  // Drilling has to land on the same list the back link points at, so both read
  // the one href.
  drillTo(id: TCategoryId): void {
    void this.#router.navigate([this.listHref()], {
      queryParams: { filter: id },
    });
  }
}
