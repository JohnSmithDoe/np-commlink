import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  imports: [
    IonBackButton,
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
  readonly label = input('');
  readonly heading = input('');
  readonly icon = input<string>();
  readonly hideButtons = input(false, { transform: booleanAttribute });
  readonly backHref = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly addItem = output<void>();

  constructor() {
    addIcons({ add });
  }
}
