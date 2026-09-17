import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-task-settings-button',
  templateUrl: 'task-settings-button.component.html',
  styleUrl: 'task-settings-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, RouterLink, TranslatePipe],
})
export class TaskSettingsButtonComponent {
  constructor() {
    addIcons({ optionsOutline });
  }
}
