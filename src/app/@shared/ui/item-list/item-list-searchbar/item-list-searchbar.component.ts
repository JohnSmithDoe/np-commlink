import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { SearchbarCustomEvent } from '@ionic/angular';
import { IonSearchbar } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, cart, list, remove } from 'ionicons/icons';

@Component({
  selector: 'app-item-list-searchbar',
  templateUrl: 'item-list-searchbar.component.html',
  styleUrls: ['item-list-searchbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSearchbar, TranslateModule],
})
export class ItemListSearchbarComponent {
  readonly query = input<string>();

  readonly queryChange = output<string | undefined>();
  readonly hitEnter = output<void>();

  constructor() {
    addIcons({ add, remove, cart, list });
  }

  searchTermChange(ev: SearchbarCustomEvent) {
    this.queryChange.emit(ev.detail.value ?? undefined);
  }
}
