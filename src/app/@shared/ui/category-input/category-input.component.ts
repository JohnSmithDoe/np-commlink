import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonChip, IonIcon, IonItem, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { TItemListCategory } from '../../types';

/**
 * Pure presentational (type:ui) category chips + "open picker" trigger — inputs
 * in (the item's selected categories), events out (remove one / open the
 * picker). Replaces the store-bound `@shared/smart-ui/category-input`; the
 * domain feature wrapper owns the selection and the picker's open state.
 */
@Component({
  selector: 'app-category-input',
  templateUrl: './category-input.component.html',
  styleUrls: ['./category-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonItem, IonLabel, IonChip, IonIcon, TranslateModule],
})
export class CategoryInputComponent {
  readonly categories = input<TItemListCategory[]>();

  readonly removeCategory = output<TItemListCategory>();
  readonly openDialog = output<void>();

  constructor() {
    addIcons({ closeCircle });
  }
}
