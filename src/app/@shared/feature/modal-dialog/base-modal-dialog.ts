import { computed, inject, linkedSignal, signal, Signal } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { ModalController } from '@ionic/angular/standalone';

/**
 * Abstract base for the imperatively-presented edit modals (cash, trackplay) —
 * the `ModalController` half of the app's two dialog idioms. Its sibling,
 * `BaseEditItemDialog`, serves the always-mounted list-item dialogs.
 *
 * Both keep the edit draft local, but their lifetimes differ, which is why they
 * are siblings rather than one generic base: a presented modal only exists while
 * it is open, so its draft is never undefined, whereas the mounted one must model
 * "closed" as `undefined`.
 *
 * Nine of these had hand-written the same skeleton: a componentProp id, an
 * `ngOnInit` copying an entity into N field signals, one setter per field, an
 * `isEdit` flag, and a confirm that branched create-vs-update before dismissing.
 * Here the id is a signal, so `existing` and `draft` are reactive and **no
 * subclass needs `OnInit`**.
 *
 * `TForm` is a view-model, not the entity: these dialogs edit mapped fields (a
 * signed amount as magnitude + direction, a zero opening balance as an empty box),
 * so the subclass supplies {@link toForm} in and {@link persist} out.
 *
 * Every subclass is on **Signal Forms**: it hands over a {@link form} field tree
 * over the draft, and validity — hence {@link canSave} — comes from that tree's
 * schema rather than from a hand-written conjunction per dialog.
 */
export abstract class BaseModalDialog<TEntity, TForm extends object> {
  readonly #modalCtrl = inject(ModalController);

  /**
   * The entity under edit; undefined = create mode. Ionic's `componentProps`
   * does a plain property write, which a signal input can't receive, so each
   * subclass declares a domain-named setter that writes here
   * (`set accountId(id) { this.editId.set(id); }`).
   */
  protected readonly editId = signal<string | undefined>(undefined);

  protected abstract readonly existing: Signal<TEntity | undefined>;
  /** The create-mode form defaults. */
  protected abstract blank(): TForm;
  /** Entity → editable form fields. */
  protected abstract toForm(entity: TEntity): TForm;
  protected abstract persist(draft: TForm, existing: TEntity | undefined): void;
  /**
   * The subclass's Signal Forms tree over {@link draft} — `form(this.draft,
   * rules)`. It must project the draft rather than a copy of it, or a reseed
   * would not reach validity.
   */
  protected abstract readonly form: FieldTree<TForm>;

  readonly isEdit = computed(() => !!this.existing());

  readonly draft = linkedSignal<TForm>(() => {
    const entity = this.existing();
    return entity ? this.toForm(entity) : this.blank();
  });

  /**
   * Saveable = the field tree is valid. Every dialog used to spell this out as a
   * conjunction over its own draft, which is the bug class Signal Forms was
   * adopted to end: a rule added to the schema had to be remembered here too,
   * and `canSave` is what the save button reads.
   */
  readonly canSave = computed(() => this.form().valid());

  /** Public so templates can bind field edits straight to it. */
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
