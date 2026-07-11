import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private readonly appName = 'np-timetracker';

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let routeTitle = this.buildTitle(snapshot);
    // If empty, traverse manually and pick first available data.title from deepest to root
    if (!routeTitle) {
      const titles: string[] = [];
      let node: ActivatedRouteSnapshot | null = snapshot.root;
      while (node) {
        const t = node.data?.['title'];
        if (t) titles.push(t);
        node = node.firstChild ?? null;
      }
      routeTitle = titles.pop() ?? '';
    }
    const translated = routeTitle ? this.translate.instant(routeTitle) : '';
    const fullTitle = translated
      ? `${translated} | ${this.appName}`
      : this.appName;
    this.title.setTitle(fullTitle);
  }
}
