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
import { ActivatedRoute } from '@angular/router';
import { PROGRAM_CONTEXT } from '../../util/program-context.token';
import { routeUrl } from '../../util/route-url';

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
  readonly #program = inject(PROGRAM_CONTEXT)(routeUrl(inject(ActivatedRoute)));

  readonly label = input('');
  readonly heading = input('');
  readonly icon = input<string>();
  readonly hideButtons = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly addItem = output<void>();

  readonly glyph = computed(() => this.icon() ?? this.#program.icon);

  constructor() {
    addIcons({ addOutline });
  }
}
