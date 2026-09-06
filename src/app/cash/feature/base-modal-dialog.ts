import {
  computed,
  inject,
  linkedSignal,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import { form, SchemaPathTree } from '@angular/forms/signals';
import { ModalController } from '@ionic/angular/standalone';

export abstract class BaseModalDialog<TEntity, TForm extends object> {
  readonly #modalCtrl = inject(ModalController);

  protected readonly editId = signal<string | undefined>(undefined);

  protected abstract readonly existing: Signal<TEntity | undefined>;
  protected abstract blank(): TForm;
  protected abstract toForm(entity: TEntity): TForm;
  protected abstract persist(draft: TForm, existing: TEntity | undefined): void;

  protected abstract applyRules(path: SchemaPathTree<TForm>): void;

  readonly isEdit = computed(() => !!this.existing());

  readonly draft = linkedSignal<string | undefined, TForm>({
    source: () => this.editId(),
    computation: () => {
      const entity = untracked(() => this.existing());
      return entity ? this.toForm(entity) : this.blank();
    },
  });

  protected readonly form = form(this.draft, (path) => this.applyRules(path));

  readonly canSave = computed(() => this.form().valid());

  patch(partial: Partial<TForm>): void {
    this.draft.update((draft) => ({ ...draft, ...partial }));
  }

  confirm(): void {
    if (!this.canSave()) {
      return;
    }
    this.persist(this.draft(), this.existing());
    this.dismiss();
  }

  cancel(): void {
    this.dismiss();
  }

  protected dismiss(): void {
    void this.#modalCtrl.dismiss();
  }
}
