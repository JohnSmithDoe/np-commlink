import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonSearchbar,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { bookOutline, refreshOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { HandbookService } from '../../data/handbook.service';
import { groupHandbookEntries } from '../../util/handbook-content';
import { handbookTerms, searchHandbook } from '../../util/handbook-search';
import { HandbookSearchResultsComponent } from '../../ui/handbook-search-results/handbook-search-results.component';
import { HandbookTocComponent } from '../../ui/handbook-toc/handbook-toc.component';

@Component({
  selector: 'app-page-handbook',
  templateUrl: 'handbook.page.html',
  styleUrls: ['handbook.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonSearchbar,
    TranslatePipe,
    PageHeaderComponent,
    HandbookSearchResultsComponent,
    HandbookTocComponent,
  ],
})
export class HandbookPage {
  readonly #handbook = inject(HandbookService);

  readonly pending = this.#handbook.indexPending;
  readonly failed = this.#handbook.indexFailed;

  readonly query = signal('');

  readonly isSearching = computed(() => handbookTerms(this.query()).length > 0);
  readonly groups = computed(() =>
    groupHandbookEntries(this.#handbook.entries())
  );
  readonly hits = computed(() =>
    searchHandbook(this.#handbook.entries(), this.query())
  );

  constructor() {
    addIcons({ bookOutline, refreshOutline });
    this.#handbook.loadIndex();
  }

  search(event: SearchbarCustomEvent): void {
    this.query.set(event.detail.value ?? '');
  }

  retry(): void {
    this.#handbook.loadIndex();
  }
}
