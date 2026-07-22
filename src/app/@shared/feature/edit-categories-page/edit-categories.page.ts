import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  checkmarkOutline,
  closeOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { TCategoryId } from '../../types';
import { matchesSearchExactly } from '../../util/app.utils';
import { CATEGORIES_FACADE } from '../../util/list/categories-page.facade';

/**
 * Domain-blind manage-categories page: the catalog of a single list rendered as
 * a sliding list with per-category item counts, inline add / rename / delete,
 * and a tap-to-drill into that list filtered to the category. It knows no list
 * identity — the catalog, counts, titles and navigation all live behind the
 * injected {@link CATEGORIES_FACADE} a consumer domain provides (grocery per
 * list, tasks). Mounted directly at the `categories/*` routes; the owning
 * domain's lazy providers + the facade binding come from the route.
 */
@Component({
  selector: 'app-edit-categories-page',
  templateUrl: './edit-categories.page.html',
  styleUrls: ['./edit-categories.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonNote,
    IonIcon,
    IonInput,
  ],
})
export class EditCategoriesPage {
  readonly facade = inject(CATEGORIES_FACADE);

  readonly newCategory = signal('');
  readonly canAdd = computed<boolean>(() => {
    const name = this.newCategory().trim();
    return (
      name.length > 0 &&
      !this.facade
        .categories()
        .some(({ category }) => matchesSearchExactly(category.name, name))
    );
  });

  // The id of the category being renamed inline (null = none) + its working text.
  readonly editing = signal<TCategoryId | null>(null);
  readonly renameText = signal('');

  constructor() {
    addIcons({
      addOutline,
      arrowBackOutline,
      checkmarkOutline,
      closeOutline,
      createOutline,
      trashOutline,
    });
  }

  add(): void {
    if (!this.canAdd()) return;
    this.facade.add(this.newCategory().trim());
    this.newCategory.set('');
  }

  drill(id: TCategoryId): void {
    if (this.editing() !== null) return;
    this.facade.drillTo(id);
  }

  startEdit(id: TCategoryId, name: string): void {
    this.editing.set(id);
    this.renameText.set(name);
  }

  commitEdit(): void {
    const id = this.editing();
    const to = this.renameText().trim();
    this.editing.set(null);
    if (!id || !to) return;
    this.facade.rename(id, to);
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  remove(id: TCategoryId): void {
    if (this.editing() === id) this.editing.set(null);
    this.facade.remove(id);
  }
}
