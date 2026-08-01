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
import { TMarker } from '../../../@shared/model/app.types';
import { TItemUnit } from '../../model/grocery-list.types';
import {
  IRecipe,
  IRecipeIngredient,
  RECIPES_LIST_ID,
} from '../../model/recipe.types';
import { RecipesFacade } from '../../data';
import {
  createRecipe,
  createRecipeIngredient,
} from '../../util/grocery.factory';
import { TItemListId } from '../../../@shared/model/item-list.types';

const UNITS: readonly TItemUnit[] = ['pieces', 'g', 'ml'];

// Spelled out rather than composed as `'grocery.unit.' + unit`, which would make
// the three keys invisible to `i18n:extract` and therefore prunable. The
// annotation is what keeps a new unit from shipping without a label.
const UNIT_LABEL_KEYS: Record<TItemUnit, TMarker> = {
  pieces: marker('grocery.unit.pieces'),
  g: marker('grocery.unit.g'),
  ml: marker('grocery.unit.ml'),
};

/**
 * Recipe edit-dialog wrapper (type:feature). The only dialog in the app whose
 * draft holds a nested collection: ingredient lines are edited in place on the
 * local draft and committed as one recipe on confirm, so a half-built ingredient
 * list never reaches the store.
 */
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
export class EditRecipeDialogComponent extends BaseEditItemDialog<IRecipe> {
  protected blank(): IRecipe {
    return createRecipe('');
  }

  readonly #facade = inject(RecipesFacade);

  protected readonly listId: TItemListId = RECIPES_LIST_ID;
  readonly siblings = this.#facade.recipes;
  readonly catalog = this.#facade.catalog;
  readonly units = UNITS;
  readonly unitLabelKeys = UNIT_LABEL_KEYS;

  // The add-ingredient picker's value, reset to null after each pick so the same
  // product can be added twice and the control always reads as a fresh prompt.
  readonly pickerValue = signal<string | null>(null);

  // Ingredient lines resolved against the catalog for display. A line whose
  // product is gone shows its raw id — see the matcher's `missingLabel`.
  readonly ingredientRows = computed(() => {
    const byId = new Map(
      this.catalog().map((product) => [product.id, product])
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

  protected save(item: IRecipe): void {
    this.#facade.saveRecipe(item);
  }

  addIngredient(event: SelectCustomEvent<string>) {
    const product = this.catalog().find(({ id }) => id === event.detail.value);
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

  setIngredientUnit(lineId: string, event: SelectCustomEvent<TItemUnit>) {
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

  #patchIngredient(lineId: string, partial: Partial<IRecipeIngredient>) {
    this.#updateIngredients((lines) =>
      lines.map((line) => (line.id === lineId ? { ...line, ...partial } : line))
    );
  }

  #updateIngredients(
    update: (lines: IRecipeIngredient[]) => IRecipeIngredient[]
  ) {
    this.patch({ ingredients: update(this.draft().ingredients) });
  }
}
