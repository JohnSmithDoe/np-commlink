import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ItemListSearchbarComponent } from './item-list-searchbar.component';

describe('ItemListSearchbarComponent', () => {
  let component: ItemListSearchbarComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideZonelessChangeDetection()],
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
