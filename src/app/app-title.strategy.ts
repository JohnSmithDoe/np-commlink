import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { APP_WORDMARK } from './@shared/model/app.consts';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  readonly #title = inject(Title);
  readonly #translate = inject(TranslateService);

  #routeTitleKey?: string;

  constructor() {
    super();
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

  #translated(): string | undefined {
    const key = this.#routeTitleKey;
    if (!key) return undefined;
    const translated: unknown = this.#translate.instant(key);
    return typeof translated === 'string' && translated !== key
      ? translated
      : undefined;
  }
}
