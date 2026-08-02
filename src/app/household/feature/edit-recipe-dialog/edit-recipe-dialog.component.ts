import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  SelectCustomEvent,
  TextareaCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { NumberInputComponent } from '../../../@shared/ui/forms/number-input/number-input.component';
import { Marker } from '../../../@shared/model/app.types';
import { ItemUnit } from '../../model/household-list.types';
import {
  Recipe,
  RecipeIngredient,
  RECIPES_LIST_ID,
} from '../../model/recipe.types';
import { RecipesFacade } from '../../data';
import {
  createRecipe,
  createRecipeIngredient,
} from '../../util/household.factory';
import { ItemListId } from '../../../@shared/model/item-list.types';

const UNITS: readonly ItemUnit[] = ['pieces', 'g', 'ml'];

const UNIT_LABEL_KEYS: Record<ItemUnit, Marker> = {
  pieces: marker('household.unit.pieces'),
  g: marker('household.unit.g'),
  ml: marker('household.unit.ml'),
};

@Component({
  selector: 'app-edit-recipe-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    TranslatePipe,
    ItemEditModalComponent,
    NumberInputComponent,
  ],
  templateUrl: './edit-recipe-dialog.component.html',
  styleUrl: './edit-recipe-dialog.component.scss',
})
export class EditRecipeDialogComponent extends BaseEditItemDialog<Recipe> {
  protected blank(): Recipe {
    return createRecipe('');
  }

  readonly #facade = inject(RecipesFacade);

  protected readonly listId: ItemListId = RECIPES_LIST_ID;
  readonly siblings = this.#facade.allItems;
  readonly ingredientCatalog = this.#facade.ingredientCatalog;
  readonly units = UNITS;
  readonly unitLabelKeys = UNIT_LABEL_KEYS;

  readonly pickerValue = signal<string | null>(null);

  readonly ingredientRows = computed(() => {
    const byId = new Map(
      this.ingredientCatalog().map((product) => [product.id, product])
    );
    return this.draft().ingredients.map((line) => ({
      line,
      name: byId.get(line.productId)?.name ?? line.productId,
    }));
  });

  constructor() {
    super();
    addIcons({ trashOutline });
  }

  protected save(item: Recipe): void {
    this.#facade.saveItem(item);
  }

  addIngredient(event: SelectCustomEvent<string>) {
    const product = this.ingredientCatalog().find(
      ({ id }) => id === event.detail.value
    );
    if (product) {
      this.#updateIngredients((lines) => [
        ...lines,
        createRecipeIngredient(product),
      ]);
    }
    this.pickerValue.set(null);
  }

  removeIngredient(lineId: string) {
    this.#updateIngredients((lines) =>
      lines.filter((line) => line.id !== lineId)
    );
  }

  setIngredientAmount(lineId: string, amount: number) {
    this.#patchIngredient(lineId, { amount });
  }

  setIngredientUnit(lineId: string, event: SelectCustomEvent<ItemUnit>) {
    this.#patchIngredient(lineId, { unit: event.detail.value });
  }

  setServings(servings: number) {
    this.patch({ servings });
  }

  setPrepMinutes(prepMinutes: number) {
    this.patch({ prepMinutes });
  }

  setSteps(event: TextareaCustomEvent) {
    this.patch({ steps: event.detail.value ?? '' });
  }

  #patchIngredient(lineId: string, partial: Partial<RecipeIngredient>) {
    this.#updateIngredients((lines) =>
      lines.map((line) => (line.id === lineId ? { ...line, ...partial } : line))
    );
  }

  #updateIngredients(
    update: (lines: RecipeIngredient[]) => RecipeIngredient[]
  ) {
    this.patch({ ingredients: update(this.draft().ingredients) });
  }
}
