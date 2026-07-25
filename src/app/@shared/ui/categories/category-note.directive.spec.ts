import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IBaseItem, ICategory } from '../../model/types';
import { COMMON_TEST_PROVIDERS } from '../../testing/test-providers';
import { mockBaseItem, mockCategory } from '../../testing/test-data';
import { CategoryNoteDirective } from './category-note.directive';

@Component({
  standalone: true,
  imports: [CategoryNoteDirective],
  // ion-note is an (inert) Ionic custom element in jsdom; allow the unknown tag.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template:
    '<ion-note [appCategoryNote]="item" [appCategoryNoteCatalog]="catalog"></ion-note>',
})
class HostComponent {
  item?: IBaseItem;
  // The list's {id,name} catalog, so category ids resolve to display names.
  catalog: ICategory[] = [];
}

describe('CategoryNoteDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  const noteElement = (): HTMLElement =>
    fixture.nativeElement.querySelector('ion-note') as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('shows the categoryIds resolved to joined catalog names', () => {
    fixture.componentInstance.catalog = [
      mockCategory({ id: 'c-a', name: 'A' }),
      mockCategory({ id: 'c-b', name: 'B' }),
    ];
    fixture.componentInstance.item = mockBaseItem({
      categoryIds: ['c-a', 'c-b'],
    });
    fixture.detectChanges();

    expect(noteElement().style.display).toBe('block');
    expect(noteElement().textContent).toBe('A, B');
  });

  it('hides the note when the item has no categories', () => {
    fixture.componentInstance.item = mockBaseItem();
    fixture.detectChanges();

    expect(noteElement().style.display).toBe('none');
  });

  it('hides the note when the item has an empty categoryIds array', () => {
    fixture.componentInstance.item = mockBaseItem({ categoryIds: [] });
    fixture.detectChanges();

    expect(noteElement().style.display).toBe('none');
  });

  it('hides the note when no catalog resolves the item categoryIds', () => {
    fixture.componentInstance.item = mockBaseItem({ categoryIds: ['c-a'] });
    // catalog left empty → the id resolves to nothing
    fixture.detectChanges();

    expect(noteElement().style.display).toBe('none');
  });

  it('hides the note when the item is undefined', () => {
    fixture.componentInstance.item = undefined;
    fixture.detectChanges();

    expect(noteElement().style.display).toBe('none');
  });
});
