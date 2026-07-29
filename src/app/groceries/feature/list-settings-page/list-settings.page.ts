import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  IonToggle,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BooleanKeys, IListSettings } from '../../model/list-settings.types';
import { ListSettingsFacade } from '../../data';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-page-list-settings',
  templateUrl: 'list-settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    IonContent,
    TranslatePipe,
    IonList,
    IonItem,
    IonToggle,
    IonListHeader,
  ],
})
export class ListSettingsPage {
  readonly #facade = inject(ListSettingsFacade);
  readonly settings = this.#facade.settings;

  toggleFlag(flag: BooleanKeys<IListSettings>) {
    this.#facade.toggleFlag(flag);
  }
}
