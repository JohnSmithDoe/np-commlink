/* ─── why ─────────────────────────────────────────────────────────
 * No slice and no facade: the handbook is content, not state — nothing
 * dispatches, nothing persists, and a reload re-fetches. What the store
 * would buy is a cache, and a `Map` already is one.
 *
 * Every read answers with a rendered state instead of throwing, because
 * the assets are the one part of this app that can be absent: a service
 * worker miss on the first offline launch reaches the page as a 404, and
 * an alert over an empty article is worse than the article saying so.
 *
 * `#openSlug` guards the response, not the request: two taps in a row
 * leave two fetches in flight, and the slower one must not paint over
 * the page the user is now on.
 * ───────────────────────────────────────────────────────────────── */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  HandbookEntry,
  HandbookIndex,
  HandbookPageContent,
} from '../model/handbook.types';
import { HANDBOOK_INDEX_URL, handbookPageUrl } from '../util/handbook-content';

@Injectable({ providedIn: 'root' })
export class HandbookService {
  readonly #http = inject(HttpClient);
  readonly #cache = new Map<string, HandbookPageContent>();

  readonly #entries = signal<readonly HandbookEntry[]>([]);
  readonly #indexPending = signal(false);
  readonly #indexFailed = signal(false);

  readonly #page = signal<HandbookPageContent | undefined>(undefined);
  readonly #pagePending = signal(false);
  readonly #pageFailed = signal(false);

  #openSlug?: string;

  readonly entries = this.#entries.asReadonly();
  readonly indexPending = this.#indexPending.asReadonly();
  readonly indexFailed = this.#indexFailed.asReadonly();

  readonly page = this.#page.asReadonly();
  readonly pagePending = this.#pagePending.asReadonly();
  readonly pageFailed = this.#pageFailed.asReadonly();

  loadIndex(): void {
    if (this.#indexPending() || this.#entries().length > 0) return;

    this.#indexFailed.set(false);
    this.#indexPending.set(true);
    this.#http.get<HandbookIndex>(HANDBOOK_INDEX_URL).subscribe({
      next: (index) => {
        this.#entries.set(index.pages ?? []);
        this.#indexPending.set(false);
      },
      error: () => {
        this.#indexPending.set(false);
        this.#indexFailed.set(true);
      },
    });
  }

  openPage(slug: string): void {
    this.#openSlug = slug;
    this.#pageFailed.set(false);

    const cached = this.#cache.get(slug);
    if (cached) {
      this.#pagePending.set(false);
      this.#page.set(cached);
      return;
    }

    this.#page.set(undefined);
    this.#pagePending.set(true);
    this.#http.get<HandbookPageContent>(handbookPageUrl(slug)).subscribe({
      next: (content) => {
        this.#cache.set(slug, content);
        if (this.#openSlug !== slug) return;
        this.#pagePending.set(false);
        this.#page.set(content);
      },
      error: () => {
        if (this.#openSlug !== slug) return;
        this.#pagePending.set(false);
        this.#pageFailed.set(true);
      },
    });
  }
}
