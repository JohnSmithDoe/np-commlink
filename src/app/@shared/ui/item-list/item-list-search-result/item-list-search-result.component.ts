import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ISearchResult, ITrackingItem } from '../../../types';
import { TextItemComponent } from '../../item-list-items/text-item/text-item.component';
import { ItemListComponent } from '../item-list.component';

@Component({
  selector: 'app-item-list-search-result',
  templateUrl: './item-list-search-result.component.html',
  styleUrls: ['./item-list-search-result.component.scss'],
  imports: [ItemListComponent, TextItemComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListSearchResultComponent<T extends ITrackingItem> {
  @Input() results?: ISearchResult<T> | null;
  @Output() selectTrackingItem = new EventEmitter<ITrackingItem>();
}
