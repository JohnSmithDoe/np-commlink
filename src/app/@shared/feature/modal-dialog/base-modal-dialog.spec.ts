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

interface ITestEntity {
  id: string;
  name: string;
}
interface ITestForm {
  name: string;
}

// A minimal concrete modal, so the base's behaviour is asserted ONCE here rather
// than in all seven presented dialogs. `entities` stands in for the slice the
// real subclasses resolve `existing` out of.
class TestModal extends BaseModalDialog<ITestEntity, ITestForm> {
  readonly entities = signal<ITestEntity[]>([]);

  protected readonly existing = computed<ITestEntity | undefined>(() =>
    this.entities().find((entity) => entity.id === this.editId())
  );

  readonly persisted: ITestForm[] = [];

  protected blank(): ITestForm {
    return { name: '' };
  }

  protected toForm(entity: ITestEntity): ITestForm {
    return { name: entity.name };
  }

  protected persist(draft: ITestForm): void {
    this.persisted.push(draft);
  }

  protected applyRules(path: SchemaPathTree<ITestForm>): void {
    requireText(path.name);
  }

  // The real subclasses expose this as a domain-named `componentProps` setter.
  edit(id: string | undefined): void {
    this.editId.set(id);
  }
}

describe('BaseModalDialog', () => {
  let modal: TestModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Ionic only for `ModalController`, which the base injects to dismiss.
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

  // The regression: `existing` is a live computed over the slice, so a reducer
  // write that rewrote the edited row used to reseed the draft and throw the
  // user's edits away. The cash category cascades do exactly that to every row
  // carrying the category, and both cash modals host the picker.
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

  // The rule modal's version of the same bug: deleting a category deletes every
  // rule using it, so `existing()` went undefined and the dialog reseeded to
  // `blank()` — turning a half-edited rule into a create form mid-edit.
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
