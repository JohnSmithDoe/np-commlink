import { computed, inject, linkedSignal, signal, Signal } from '@angular/core';
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
 * `TForm` is a view-model, not the entity: these dialogs edit mapped fields (cents
 * as a de-DE string, a signed amount as magnitude + direction), so the subclass
 * supplies {@link toForm} in and {@link persist} out.
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
  abstract readonly canSave: Signal<boolean>;
  protected abstract persist(draft: TForm, existing: TEntity | undefined): void;

  readonly isEdit = computed(() => !!this.existing());

  readonly draft = linkedSignal<TForm>(() => {
    const entity = this.existing();
    return entity ? this.toForm(entity) : this.blank();
  });

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
