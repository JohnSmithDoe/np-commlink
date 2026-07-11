import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, bagAdd, clipboard, remove, settingsSharp } from 'ionicons/icons';
import { IAppState, TItemListSortType } from '../../../@shared/types';
import { dialogsActions } from '../../data/dialogs/dialogs.actions';
import { ItemListEmptyComponent } from '../../../@shared/ui/item-list/item-list-empty/item-list-empty.component';
import { ItemListSearchbarComponent } from '../../../@shared/ui/item-list/item-list-searchbar/item-list-searchbar.component';
import { ItemListToolbarComponent } from '../../../@shared/ui/item-list/item-list-toolbar/item-list-toolbar.component';
import {
  ItemListComponent,
  ItemListTemplateContext,
} from '../../../@shared/ui/item-list/item-list.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  selectListItems,
  selectListSearchResult,
  selectListState,
} from '../../../@shared/data/item-list/item-list.selector';
import { itemListActions } from '../../../@shared/data/item-list/item-list.actions';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-page',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    ItemListComponent,
    ItemListEmptyComponent,
    ItemListSearchbarComponent,
    ItemListToolbarComponent,
    PageHeaderComponent,
    TranslateModule,
    IonButton,
    IonIcon,
    RouterLink,
  ],
})
export class ListPageComponent {
  readonly #store = inject(Store<IAppState>);

  readonly itemTemplate =
    input.required<TemplateRef<ItemListTemplateContext>>();
  readonly listHeader = input.required<string>();
  readonly pageHeader = input.required<string>();
  readonly icon = input<string>();

  readonly state = this.#store.selectSignal(selectListState);
  readonly items = this.#store.selectSignal(selectListItems);
  readonly searchResult = this.#store.selectSignal(selectListSearchResult);

  constructor() {
    addIcons({ add, remove, clipboard, bagAdd, settingsSharp });
  }

  addItemFromSearch() {
    this.#store.dispatch(itemListActions.addItemFromSearch());
  }

  searchFor(searchTerm?: string) {
    this.#store.dispatch(itemListActions.updateSearch(searchTerm));
  }

  setSortMode(type: TItemListSortType) {
    this.#store.dispatch(itemListActions.updateSort(type, 'toggle'));
  }

  showCreateDialog() {
    this.#store.dispatch(dialogsActions.showCreateDialogWithSearch());
  }
}
