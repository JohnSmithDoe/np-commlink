import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-browse-steps',
  templateUrl: './browse-steps.component.html',
  styleUrl: './browse-steps.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, RouterLink, TranslatePipe],
})
export class BrowseStepsComponent {
  readonly previousLink = input.required<readonly string[]>();
  readonly previousKey = input.required<string>();
  readonly nextLink = input.required<readonly string[]>();
  readonly nextKey = input.required<string>();

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }
}
