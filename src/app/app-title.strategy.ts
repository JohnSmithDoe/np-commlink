import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { APP_WORDMARK } from './@shared/model/app.consts';

/**
 * The document title: a route's own `page-title.*` key, translated, beside the
 * app name.
 *
 * `buildTitle` does the walking. It used to be called and then ignored — the
 * manifests declared `data: { title }` while the router only ever reads
 * `data[RouteTitleKey]`, a Symbol it fills in from a route's `title` **property**
 * — so it could not return anything but `undefined` here, and the fallback below
 * it (a hand-rolled `firstChild` descent) was the whole implementation. Moving the
 * manifests onto `title:` deletes that copy and picks up what the framework
 * already offers: deepest-wins inheritance, and a `ResolveFn<string>` for a title
 * that ever has to be computed.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  readonly #title = inject(Title);
  readonly #translate = inject(TranslateService);

  /** The key the current route asked for, kept so a late bundle can re-render it. */
  #routeTitleKey?: string;

  constructor() {
    super();
    // `updateTitle` runs on navigation and nothing else, and the FIRST navigation
    // races the i18n fetch it depends on — so on a cold load the title was
    // resolved before any bundle existed and then never revisited.
    // `onLangChange` fires when a language's translations become available, which
    // is exactly the moment the answer changes.
    this.#translate.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.#render());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.#routeTitleKey = this.buildTitle(snapshot);
    this.#render();
  }

  #render(): void {
    const translated = this.#translated();
    this.#title.setTitle(
      translated ? `${translated} | ${APP_WORDMARK}` : APP_WORDMARK
    );
  }

  /**
   * The route's title in the user's language, or nothing.
   *
   * `instant` echoes the key back when it cannot resolve it, so the two ways a raw
   * `page-title.commlink` reaches the tab — the bundle has not landed, and the key
   * does not exist — are both caught by comparing against the key. The app name
   * alone is the better answer to either: it is true, and on the first of them the
   * real title arrives a moment later.
   */
  #translated(): string | undefined {
    const key = this.#routeTitleKey;
    if (!key) return undefined;
    const translated: unknown = this.#translate.instant(key);
    return typeof translated === 'string' && translated !== key
      ? translated
      : undefined;
  }
}
