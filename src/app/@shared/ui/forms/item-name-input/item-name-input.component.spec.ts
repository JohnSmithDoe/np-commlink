import { provideZonelessChangeDetection, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { IBaseItem } from '../../../model/types';
import { ItemNameInputComponent } from './item-name-input.component';

const item = (name: string): IBaseItem => ({
  id: '1',
  name,
  createdAt: '2026-01-01',
});

describe('ItemNameInputComponent', () => {
  let fixture: ComponentFixture<ItemNameInputComponent>;
  let component: ItemNameInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ItemNameInputComponent, TranslateModule.forRoot()],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ItemNameInputComponent);
    component = fixture.componentInstance;
  });

  const withListItems = (items: IBaseItem[]) => {
    fixture.componentRef.setInput('listItems', items);
    fixture.componentRef.setInput('item', null);
    component.ngOnChanges({ listItems: new SimpleChange(null, items, true) });
  };

  it('rejects a name that duplicates another item, accepts a unique one', () => {
    withListItems([item('Foo')]);

    component.nameControl.setValue('Foo');
    expect(component.invalid()).toBe(true);
    expect(component.getErrorText()).toBe(
      'edit.item.dialog.name.duplicate.error'
    );

    component.nameControl.setValue('Groceries');
    expect(component.valid()).toBe(true);
  });

  it('flags an empty name', () => {
    withListItems([item('Foo')]);

    component.nameControl.setValue('');
    expect(component.invalid()).toBe(true);
    expect(component.getErrorText()).toBe('edit.item.dialog.name.empty.error');
  });

  it("adopts the edited item's name into the control", () => {
    fixture.componentRef.setInput('item', item('Bar'));
    component.ngOnChanges({ item: new SimpleChange(null, item('Bar'), true) });
    expect(component.nameControl.value).toBe('Bar');
  });
});
