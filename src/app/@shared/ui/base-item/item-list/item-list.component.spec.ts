import { provideZonelessChangeDetection, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReorderEndCustomEvent } from '@ionic/angular/standalone';
import { BaseItem } from '../../../model/base-item.types';
import { ItemListComponent } from './item-list.component';

const reorderEnd = (from: number, to: number): ReorderEndCustomEvent =>
  ({
    detail: { from, to, complete: () => {} },
  }) as unknown as ReorderEndCustomEvent;

const items = (...names: string[]): BaseItem[] =>
  names.map((name) => ({ id: name, name }));

describe('ItemListComponent', () => {
  let fixture: ComponentFixture<ItemListComponent>;
  let component: ItemListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('itemTemplate', {} as TemplateRef<unknown>);
    fixture.componentRef.setInput('items', []);
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('reports the ids in the order the drag produced', () => {
    fixture.componentRef.setInput('items', items('a', 'b', 'c'));
    const reported: string[][] = [];
    component.reorder.subscribe((ids) => reported.push(ids));

    component.onReorderEnd(reorderEnd(2, 0));

    expect(reported).toEqual([['c', 'a', 'b']]);
  });

  it('renders no reorder group while dragging is off', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('ion-reorder-group')).toBeNull();
  });

  it('wraps the rows in a reorder group once dragging is on', async () => {
    fixture.componentRef.setInput('reorderable', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('ion-list ion-reorder-group')
    ).not.toBeNull();
  });
});
