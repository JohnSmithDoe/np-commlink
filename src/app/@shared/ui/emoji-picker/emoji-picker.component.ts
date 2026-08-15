/* ─── why ─────────────────────────────────────────────────────────
 * The picker reads the field's value and caret ONCE, on present, and only
 * text leaves again as `changed` — the trigger button held focus, not the
 * field, so there is no caret to restore on the way out.
 *
 * The caret then lives in ONE place, the preview input. A TypeScript
 * mirror would duplicate a position the DOM has to get right anyway, and
 * keeping the two equal costs a two-way sync no event set fully covers.
 *
 * What is read back is a RANGE, not a point: on the desktop this control
 * is gated to, select-then-type is the idiom, and reading only
 * `selectionStart` made ⌫ delete the character BEFORE a selection and
 * leave the selection standing. The mirror only looked necessary because
 * the read was off the FIELD, whose `[value]` had not flushed once the
 * modal took focus; the preview is neither stale nor unfocused.
 *
 * `#writeBack` sets native value AND selection eagerly, before Ionic
 * renders — an identical string assigns as a no-op, so the render cannot
 * bounce the caret to the end the way a bare `[value]` would. Only a real
 * browser can falsify that: `e2e/desktop/`.
 * ───────────────────────────────────────────────────────────────── */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  InputCustomEvent,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonModal,
  IonNote,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  SearchbarCustomEvent,
  SegmentCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { backspaceOutline } from 'ionicons/icons';
import { Marker } from '../../model/app.types';
import { deleteRange, replaceRange } from '../../util/emoji/emoji-text.utils';
import {
  EMOJI_GROUP_IDS,
  emojiMatching,
  isGroupId,
  loadEmojiCatalog,
  EmojiEntry,
  EmojiGroupId,
} from '../../util/emoji/emoji.catalog';
import { APP_LANGUAGE } from '../../util/theme/language.boot';

const GROUP_LABELS: Readonly<Record<EmojiGroupId, Marker>> = {
  smileys: marker('emoji-picker.group.smileys'),
  people: marker('emoji-picker.group.people'),
  nature: marker('emoji-picker.group.nature'),
  food: marker('emoji-picker.group.food'),
  travel: marker('emoji-picker.group.travel'),
  activities: marker('emoji-picker.group.activities'),
  objects: marker('emoji-picker.group.objects'),
  symbols: marker('emoji-picker.group.symbols'),
};

@Component({
  selector: 'app-emoji-picker',
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonTitle,
    IonContent,
    IonNote,
    TranslatePipe,
  ],
})
export class EmojiPickerComponent {
  readonly #language = inject(APP_LANGUAGE);

  readonly isOpen = input<boolean>(false);
  readonly recent = input<readonly string[]>([]);
  readonly field = input<IonInput | undefined>(undefined);

  readonly changed = output<string>();
  readonly closed = output<void>();
  readonly dismissed = output<void>();

  constructor() {
    addIcons({ backspaceOutline });
  }

  protected readonly groupIds = EMOJI_GROUP_IDS;
  protected readonly groupLabels = GROUP_LABELS;
  protected readonly preview = viewChild('preview', { read: IonInput });

  protected readonly text = signal('');

  protected readonly query = linkedSignal<boolean, string>({
    source: () => this.isOpen(),
    computation: (open, previous) => (open ? '' : (previous?.value ?? '')),
  });
  protected readonly activeGroup = signal<EmojiGroupId>('smileys');

  readonly #everOpened = linkedSignal<boolean, boolean>({
    source: () => this.isOpen(),
    computation: (open, previous) => open || (previous?.value ?? false),
  });

  readonly #catalog = resource({
    params: () => (this.#everOpened() ? this.#language : undefined),
    loader: ({ params }) => loadEmojiCatalog(params),
    defaultValue: [],
  });

  protected readonly isLoading = this.#catalog.isLoading;
  protected readonly failed = computed(
    () => this.#catalog.status() === 'error'
  );

  readonly #groups = computed(() =>
    this.#catalog.hasValue() ? this.#catalog.value() : []
  );

  readonly #labelByGlyph = computed(
    () =>
      new Map(
        this.#groups().flatMap((group) =>
          group.entries.map((entry) => [entry.glyph, entry.label] as const)
        )
      )
  );

  protected readonly recentEntries = computed(() =>
    this.recent().map((glyph) => ({
      glyph,
      label: this.#labelByGlyph().get(glyph) ?? glyph,
    }))
  );

  protected readonly visible = computed<readonly EmojiEntry[]>(() => {
    const groups = this.#groups();
    const query = this.query().trim();
    if (query.length === 0) {
      const active = groups.find((group) => group.id === this.activeGroup());
      return active?.entries ?? [];
    }
    const matches = emojiMatching(query);
    return groups.flatMap((group) =>
      group.entries.filter((entry) => matches(entry))
    );
  });

  protected searchbarInput(event: SearchbarCustomEvent): void {
    this.query.set(event.detail.value ?? '');
  }

  protected segmentChange(event: SegmentCustomEvent): void {
    const group = event.detail.value;
    if (isGroupId(group)) this.activeGroup.set(group);
  }

  protected retry(): void {
    this.#catalog.reload();
  }

  protected async pick(glyph: string): Promise<void> {
    const { start, end } = await this.#selectionInPreview();
    this.#apply(
      replaceRange(this.text(), glyph, start, end),
      start + glyph.length
    );
  }

  protected async backspace(): Promise<void> {
    const { start, end } = await this.#selectionInPreview();
    const next = deleteRange(this.text(), start, end);
    this.#apply(next.text, next.caret);
  }

  async #selectionInPreview(): Promise<{ start: number; end: number }> {
    const native = await this.preview()?.getInputElement();
    const collapsed = this.text().length;
    return {
      start: native?.selectionStart ?? collapsed,
      end: native?.selectionEnd ?? collapsed,
    };
  }

  #apply(text: string, caret: number): void {
    this.text.set(text);
    this.changed.emit(text);
    void this.#writeBack(text, caret);
  }

  async #writeBack(text: string, caret: number): Promise<void> {
    const native = await this.preview()?.getInputElement();
    if (!native) return;
    native.value = text;
    native.setSelectionRange(caret, caret);
  }

  protected previewInput(event: InputCustomEvent): void {
    const text = String(event.detail.value ?? '');
    this.text.set(text);
    this.changed.emit(text);
  }

  protected async presented(): Promise<void> {
    const source = await this.field()?.getInputElement();
    const text = source?.value ?? '';

    this.text.set(text);

    await this.#writeBack(text, source?.selectionStart ?? text.length);
    const native = await this.preview()?.getInputElement();
    native?.focus();
  }
}
