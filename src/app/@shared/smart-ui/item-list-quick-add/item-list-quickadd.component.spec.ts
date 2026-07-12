import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IAppState } from '../../../@shared/types';
import { provideTestingProviders } from '../../../@shared/testing/test-providers';
import {
  mockQuickAddState,
  mockListSettings,
} from '../../../@shared/testing/test-data';
import { ItemListQuickaddComponent } from './item-list-quickadd.component';

async function setup(state: Partial<IAppState>) {
  await TestBed.configureTestingModule({
    imports: [ItemListQuickaddComponent],
    providers: provideTestingProviders(state),
  }).compileComponents();
  const fixture: ComponentFixture<ItemListQuickaddComponent> =
    TestBed.createComponent(ItemListQuickaddComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('ItemListQuickaddComponent', () => {
  it('should create', async () => {
    const { component } = await setup({});
    expect(component).toBeTruthy();
  });

  it('exposes rxShowLocal=true when the store allows a local quick-add', async () => {
    const { component } = await setup({
      quickadd: mockQuickAddState({ canAddLocal: true }),
      listSettings: mockListSettings({ showQuickAdd: true }),
    });

    expect(component.rxShowLocal()).toBe(true);
    expect(component.rxShowGlobal()).toBe(false);
    expect(component.rxShowCategoy()).toBe(false);
  });

  it('exposes rxShowGlobal=true when the store allows a global quick-add', async () => {
    const { component } = await setup({
      quickadd: mockQuickAddState({ canAddGlobal: true }),
      listSettings: mockListSettings({ showQuickAddGlobal: true }),
    });

    expect(component.rxShowGlobal()).toBe(true);
    expect(component.rxShowLocal()).toBe(false);
  });

  it('exposes rxShowCategoy=true when the store allows a category quick-add', async () => {
    const { component } = await setup({
      quickadd: mockQuickAddState({ canAddCategory: true }),
      listSettings: mockListSettings({ showQuickAddCategory: true }),
    });

    expect(component.rxShowCategoy()).toBe(true);
  });

  it('keeps rxShowLocal=false when the setting is disabled', async () => {
    const { component } = await setup({
      quickadd: mockQuickAddState({ canAddLocal: true }),
      listSettings: mockListSettings({ showQuickAdd: false }),
    });

    expect(component.rxShowLocal()).toBe(false);
  });

  it('renders a quick-add text item when local quick-add is enabled', async () => {
    const { fixture } = await setup({
      quickadd: mockQuickAddState({ canAddLocal: true, searchQuery: 'Milk' }),
      listSettings: mockListSettings({ showQuickAdd: true }),
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-text-item')
    ).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Milk');
  });

  it('renders nothing when no quick-add option is available', async () => {
    const { fixture } = await setup({
      quickadd: mockQuickAddState(),
      listSettings: mockListSettings(),
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('app-text-item')
    ).toHaveLength(0);
  });

  it('emits quickAddItem', async () => {
    const { component } = await setup({});
    const emitted: void[] = [];
    component.quickAddItem.subscribe((v) => emitted.push(v));

    component.quickAddItem.emit();

    expect(emitted).toHaveLength(1);
  });

  it('emits quickCreateGlobal', async () => {
    const { component } = await setup({});
    const emitted: void[] = [];
    component.quickCreateGlobal.subscribe((v) => emitted.push(v));

    component.quickCreateGlobal.emit();

    expect(emitted).toHaveLength(1);
  });

  it('emits quickCreateCategory', async () => {
    const { component } = await setup({});
    const emitted: void[] = [];
    component.quickCreateCategory.subscribe((v) => emitted.push(v));

    component.quickCreateCategory.emit();

    expect(emitted).toHaveLength(1);
  });
});
