import {
  computed,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SchemaPathTree } from '@angular/forms/signals';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { requireText } from '../../util/forms/form-rules';
import { BaseModalDialog } from './base-modal-dialog';

interface TestEntity {
  id: string;
  name: string;
}
interface TestForm {
  name: string;
}

class TestModal extends BaseModalDialog<TestEntity, TestForm> {
  readonly entities = signal<TestEntity[]>([]);

  protected readonly existing = computed<TestEntity | undefined>(() =>
    this.entities().find((entity) => entity.id === this.editId())
  );

  readonly persisted: TestForm[] = [];

  protected blank(): TestForm {
    return { name: '' };
  }

  protected toForm(entity: TestEntity): TestForm {
    return { name: entity.name };
  }

  protected persist(draft: TestForm): void {
    this.persisted.push(draft);
  }

  protected applyRules(path: SchemaPathTree<TestForm>): void {
    requireText(path.name);
  }

  edit(id: string | undefined): void {
    this.editId.set(id);
  }
}

describe('BaseModalDialog', () => {
  let modal: TestModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideIonicAngular()],
    });
    modal = TestBed.runInInjectionContext(() => new TestModal());
    modal.entities.set([
      { id: 'a', name: 'Lebensmittel' },
      { id: 'b', name: 'Miete' },
    ]);
  });

  it('is in create mode with a blank draft until an id arrives', () => {
    expect(modal.isEdit()).toBe(false);
    expect(modal.draft()).toEqual({ name: '' });
    expect(modal.canSave()).toBe(false);
  });

  it('seeds the draft from the entity the id names', () => {
    modal.edit('a');

    expect(modal.isEdit()).toBe(true);
    expect(modal.draft()).toEqual({ name: 'Lebensmittel' });
  });

  it('reseeds when a different entity comes under edit', () => {
    modal.edit('a');
    modal.patch({ name: 'edited' });

    modal.edit('b');

    expect(modal.draft()).toEqual({ name: 'Miete' });
  });

  it('keeps an in-progress draft when the store rewrites the same entity', () => {
    modal.edit('a');
    modal.patch({ name: 'half typed' });

    modal.entities.update((entities) =>
      entities.map((entity) =>
        entity.id === 'a' ? { ...entity, name: 'Lebensmittel' } : entity
      )
    );

    expect(modal.draft()).toEqual({ name: 'half typed' });
  });

  it('keeps the draft and does not fall back to create mode when the entity is deleted', () => {
    modal.edit('a');
    modal.patch({ name: 'half typed' });

    modal.entities.update((entities) =>
      entities.filter((entity) => entity.id !== 'a')
    );

    expect(modal.draft()).toEqual({ name: 'half typed' });
  });

  it('refuses to persist a draft the schema rejects', () => {
    modal.edit('a');
    modal.patch({ name: ' '.repeat(3) });

    expect(modal.canSave()).toBe(false);

    modal.confirm();

    expect(modal.persisted).toEqual([]);
  });
});
