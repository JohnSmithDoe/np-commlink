import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IBaseItem } from '../types';
import { COMMON_TEST_PROVIDERS } from '../testing/test-providers';
import { mockStorageItem } from '../testing/test-data';
import { CategoryNoteDirective } from './category-note.directive';

@Component({
  standalone: true,
  imports: [CategoryNoteDirective],
  // ion-note is an (inert) Ionic custom element in jsdom; allow the unknown tag.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<ion-note [appCategoryNote]="item"></ion-note>',
})
class HostComponent {
  item?: IBaseItem;
}

describe('CategoryNoteDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  const noteEl = (): HTMLElement =>
    fixture.nativeElement.querySelector('ion-note') as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [...COMMON_TEST_PROVIDERS],
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('shows the joined categories when the item has categories', () => {
    fixture.componentInstance.item = mockStorageItem({ category: ['A', 'B'] });
    fixture.detectChanges();

    expect(noteEl().style.display).toBe('block');
    expect(noteEl().innerText).toBe('A, B');
  });

  it('hides the note when the item has no categories', () => {
    fixture.componentInstance.item = mockStorageItem();
    fixture.detectChanges();

    expect(noteEl().style.display).toBe('none');
  });

  it('hides the note when the item has an empty category array', () => {
    fixture.componentInstance.item = mockStorageItem({ category: [] });
    fixture.detectChanges();

    expect(noteEl().style.display).toBe('none');
  });

  it('hides the note when the item is undefined', () => {
    fixture.componentInstance.item = undefined;
    fixture.detectChanges();

    expect(noteEl().style.display).toBe('none');
  });
});
