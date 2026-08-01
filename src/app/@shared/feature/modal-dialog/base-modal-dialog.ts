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
   * The dialog's own validation schema, applied to the tree this base builds.
   *
   * A **method**, not a field: {@link form} below evaluates its schema eagerly,
   * during this base's field initialization — so a subclass field would not exist
   * yet, while a prototype method always does. Anything the schema *reads* has to
   * be deferred for the same reason, which is why the rule dialog hands its
   * locale over as a thunk (the arrangement `requireUniqueName` already uses).
   */
  protected abstract applyRules(path: SchemaPathTree<TForm>): void;

  readonly isEdit = computed(() => !!this.existing());

  /**
   * Reseeded when a DIFFERENT entity comes under edit — which is what
   * {@link editId} changing means — and not merely when the store hands back a
   * new object for the same one.
   *
   * Tracking `existing` itself made any reducer write that rewrote the edited
   * row discard the user's work, and the category cascades do exactly that:
   * deleting a category clears it off every transaction and drops every rule
   * using it, and a merging rename remaps both. Both cash modals embed the
   * category picker, so deleting a category from inside an open transaction
   * modal silently reverted the description, amount, direction, date and
   * pending flag — and from the rule modal it reseeded to `blank()`, flipping a
   * half-edited rule into create mode.
   *
   * The entity is read untracked for that reason. It cannot be missing while
   * `editId` is set: all seven subclasses resolve `existing` out of a slice
   * their route resolver has already hydrated, so there is no "arrives later"
   * state a reference subscription would have been needed to catch.
   */
  readonly draft = linkedSignal<string | undefined, TForm>({
    source: () => this.editId(),
    computation: () => {
      const entity = untracked(() => this.existing());
      return entity ? this.toForm(entity) : this.blank();
    },
  });

  /**
   * The Signal Forms tree over {@link draft}, built here rather than by each
   * subclass.
   *
   * It must *project* the draft signal rather than a copy of it, or the reseed on
   * `existing()` would never reach validity — and that was seven verbatim
   * `form(this.draft, rules)` declarations, two of which carried a comment
   * restating the rule, which is what enforcement-by-memory looks like. An eighth
   * modal writing `form(signal({ ...this.draft() }), rules)` would have compiled
   * and then silently stopped re-validating after a reseed. Same argument as
   * `BaseEditItemDialog` owning its field tree: an invariant every subclass must
   * hold is not a subclass's decision.
   */
  protected readonly form = form(this.draft, (path) => this.applyRules(path));

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
