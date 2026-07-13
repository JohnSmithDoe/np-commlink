import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  IonToggle,
} from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { BooleanKeys, IListSettings } from '../../../@shared/types';
import { ListSettingsActions } from '../../../@shared/data/list-settings/list-settings.actions';
import { selectListSettingsState } from '../../../@shared/data/list-settings/list-settings.selector';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-page-list-settings',
  templateUrl: 'list-settings.page.html',
  styleUrls: ['list-settings.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    IonContent,
    TranslateModule,
    IonList,
    IonItem,
    IonToggle,
    IonListHeader,
  ],
})
export class ListSettingsPage {
  readonly #store = inject(Store);
  readonly settings = this.#store.selectSignal(selectListSettingsState);

  toggleFlag(flag: BooleanKeys<IListSettings>) {
    this.#store.dispatch(ListSettingsActions.toggleFlag(flag));
  }
}
