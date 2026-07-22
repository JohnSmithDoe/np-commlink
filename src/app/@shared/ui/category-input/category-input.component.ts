import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { ICategory, TCategoryId } from '../../types';

/**
 * Pure presentational (type:ui) category chips + "open picker" trigger — inputs
 * in (the item's selected categories, as resolved {id,name} objects), events out
 * (remove one by id / open the picker). Replaces the store-bound
 * `@shared/smart-ui/category-input`; the domain feature wrapper owns the
 * selection (resolving the draft's category ids → objects) and the picker's open
 * state.
 */
@Component({
  selector: 'app-category-input',
  templateUrl: './category-input.component.html',
  styleUrls: ['./category-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonChip, IonButton, IonIcon, TranslateModule],
})
export class CategoryInputComponent {
  readonly categories = input<ICategory[]>();

  readonly removeCategory = output<TCategoryId>();
  readonly openDialog = output<void>();

  constructor() {
    addIcons({ closeCircle });
  }
}
