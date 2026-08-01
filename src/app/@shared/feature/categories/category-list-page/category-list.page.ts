import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { ICategory, TCategoryId } from '../../../model/category.types';
import { CATEGORY_LIST_FACADE } from '../../../util/categories/category-list.facade';
import {
  ListItemComponent,
  TStartSwipeAction,
} from '../../../ui/base-item/list-item/list-item.component';
import { EditCategoryDialogComponent } from '../edit-category-dialog/edit-category-dialog.component';
import { ListPageComponent } from '../../item-lists/list-page/list-page.component';

/**
 * The catalog page: domain-blind, and the ordinary {@link ListPageComponent} with
 * a projected row — not a page of its own. It replaced `EditCategoriesPage`, which
 * reimplemented a list (inline add box, inline rename, swipe row, counts) beside
 * the one the app already had.
 *
 * Its facade omits `manageCategories`, the same configuration the tracking list
 * uses and for the same reason: this list references no catalog of its own, so
 * the entry button to one would point back at this page.
 *
 * Three gestures, because a catalog row does one thing an item row does not —
 * tap DRILLS into the owning list filtered to the category, rather than opening
 * the edit dialog; the start-swipe renames; the end-swipe deletes and cascades.
 */
@Component({
  selector: 'app-page-category-list',
  templateUrl: './category-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    IonNote,
    RouterLink,
    TranslatePipe,
    ListPageComponent,
    ListItemComponent,
    EditCategoryDialogComponent,
  ],
})
export class CategoryListPage {
  readonly facade = inject(CATEGORY_LIST_FACADE);

  readonly startSwipeAction: TStartSwipeAction = {
    labelKey: marker('categories.a11y.rename'),
    icon: 'create-outline',
  };

  constructor() {
    addIcons({ arrowBackOutline });
  }

  count(categoryId: TCategoryId): number {
    return this.facade.countById().get(categoryId) ?? 0;
  }

  rename(category: ICategory): void {
    this.facade.showEditDialog(category);
  }
}
