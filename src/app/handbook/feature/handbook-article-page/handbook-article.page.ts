/* ─── why ─────────────────────────────────────────────────────────
 * The slug is read from `paramMap` rather than a snapshot because a
 * prev/next tap navigates within the SAME route: Angular reuses the
 * component and a snapshot would keep answering with the article the
 * reader arrived on.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  refreshOutline,
} from 'ionicons/icons';
import { map } from 'rxjs';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { HandbookService } from '../../data/handbook.service';
import { handbookNeighbours } from '../../util/handbook-content';
import { HandbookArticleComponent } from '../../ui/handbook-article/handbook-article.component';
import { HandbookTitleComponent } from '../../ui/handbook-title/handbook-title.component';

@Component({
  selector: 'app-page-handbook-article',
  templateUrl: 'handbook-article.page.html',
  styleUrls: ['handbook-article.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    TranslatePipe,
    PageHeaderComponent,
    HandbookArticleComponent,
    HandbookTitleComponent,
  ],
})
export class HandbookArticlePage {
  readonly #handbook = inject(HandbookService);
  readonly #route = inject(ActivatedRoute);

  readonly slug = toSignal(
    this.#route.paramMap.pipe(
      map((routeParameters) => routeParameters.get('slug') ?? '')
    ),
    { initialValue: '' }
  );

  readonly article = this.#handbook.page;
  readonly pending = this.#handbook.pagePending;
  readonly failed = this.#handbook.pageFailed;

  readonly #neighbours = computed(() =>
    handbookNeighbours(this.#handbook.entries(), this.slug())
  );
  readonly previous = computed(() => this.#neighbours().previous);
  readonly next = computed(() => this.#neighbours().next);

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline, refreshOutline });
    this.#handbook.loadIndex();
    effect(() => {
      const slug = this.slug();
      if (slug) this.#handbook.openPage(slug);
    });
  }

  retry(): void {
    this.#handbook.openPage(this.slug());
  }
}
