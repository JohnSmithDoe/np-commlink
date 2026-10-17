import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { optionsOutline } from 'ionicons/icons';
import { Marker } from '../../model/app.types';

@Component({
  selector: 'app-settings-link-button',
  templateUrl: 'settings-link-button.component.html',
  styleUrl: 'settings-link-button.component.scss',
  imports: [IonButton, IonIcon, RouterLink, TranslatePipe],
})
export class SettingsLinkButtonComponent {
  readonly route = input.required<string>();
  readonly label = input.required<Marker>();

  constructor() {
    addIcons({ optionsOutline });
  }
}
