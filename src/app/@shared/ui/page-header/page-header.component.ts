import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { PROGRAM_ICON } from '../../util/program-icon.token';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  imports: [
    IonToolbar,
    IonHeader,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    TranslatePipe,
  ],
})
export class PageHeaderComponent {
  readonly #programIcon = inject(PROGRAM_ICON);

  readonly label = input('');
  readonly heading = input('');
  readonly icon = input<string>();
  readonly hideButtons = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly addItem = output<void>();

  readonly glyph = computed(() => this.icon() ?? this.#programIcon());

  constructor() {
    addIcons({ addOutline });
  }
}
