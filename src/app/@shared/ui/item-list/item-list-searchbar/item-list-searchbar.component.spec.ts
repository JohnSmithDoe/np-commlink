import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { ItemListSearchbarComponent } from './item-list-searchbar.component';

describe('ItemListSearchbarComponent', () => {
  let component: ItemListSearchbarComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(
      ItemListSearchbarComponent
    ).componentInstance;
  });

  it('re-emits the searchbar value, mapping null to undefined', () => {
    const emitted: (string | undefined)[] = [];
    component.queryChange.subscribe((v) => emitted.push(v));

    component.searchTermChange({ detail: { value: 'milk' } } as never);
    component.searchTermChange({ detail: { value: null } } as never);

    expect(emitted).toEqual(['milk', undefined]);
  });
});
