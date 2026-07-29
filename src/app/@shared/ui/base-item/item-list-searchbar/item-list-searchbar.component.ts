import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonSearchbar, SearchbarCustomEvent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-item-list-searchbar',
  templateUrl: 'item-list-searchbar.component.html',
  styleUrls: ['item-list-searchbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonSearchbar, TranslatePipe],
})
export class ItemListSearchbarComponent {
  readonly query = input<string>();

  readonly queryChange = output<string | undefined>();
  readonly hitEnter = output<void>();

  searchTermChange(event: SearchbarCustomEvent) {
    this.queryChange.emit(event.detail.value ?? undefined);
  }
}
