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
} from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
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
import { TMarker } from '../../model/app.types';
import {
  emojiMatching,
  EMOJI_GROUP_IDS,
  loadEmojiCatalog,
  TEmojiEntry,
  TEmojiGroupId,
} from '../../util/emoji/emoji.catalog';
import { LanguageService } from '../../util/theme/language.service';

type TEmojiPickerMode = 'single' | 'multiple';

// A `Record<TEmojiGroupId, …>` so a group added to the catalog is a compile
// error here rather than a raw key on screen — the arrangement the deck's
// theme labels already use. Spelled out, never composed, or `i18n:extract
// --clean` cannot see them.
const GROUP_LABELS: Readonly<Record<TEmojiGroupId, TMarker>> = {
  smileys: marker('emoji-picker.group.smileys'),
  people: marker('emoji-picker.group.people'),
  nature: marker('emoji-picker.group.nature'),
  food: marker('emoji-picker.group.food'),
  travel: marker('emoji-picker.group.travel'),
  activities: marker('emoji-picker.group.activities'),
  objects: marker('emoji-picker.group.objects'),
  symbols: marker('emoji-picker.group.symbols'),
};

/**
 * Pure presentational (type:ui) emoji picker — one grid reused by every list
 * item dialog. It knows no store and no domain: it takes the recently-used
 * glyphs as an input and emits the one that was tapped.
 *
 * Unlike `categories-dialog` it is nested directly inside its trigger
 * (`app-item-name-input`) rather than hoisted into the domain feature wrappers.
 * That dialog needs a domain's catalog and its add/rename/delete commands; this
 * one needs nothing any domain owns, so `type:ui → sameTag` is enough and the
 * six wrappers stay untouched.
 */
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
  readonly #language = inject(LanguageService);

  readonly isOpen = input<boolean>(false);
  readonly recent = input<readonly string[]>([]);
  /**
   * `single` closes on the first pick; `multiple` stays open so glyphs can be
   * added one after another, and only the header button closes it.
   *
   * The picker decides this rather than the host, so "what a pick means" has one
   * home — a host that closed on its own `picked` handler would silently
   * contradict `multiple`.
   */
  readonly mode = input<TEmojiPickerMode>('single');

  readonly picked = output<string>();
  readonly closed = output<void>();
  readonly dismissed = output<void>();

  protected readonly groupIds = EMOJI_GROUP_IDS;
  protected readonly groupLabels = GROUP_LABELS;

  /**
   * Cleared each time the picker (re)opens rather than on each pick: in
   * `multiple` a pick keeps the dialog up, and resetting there would pull the
   * result set out from under someone adding a second glyph from it. The tab
   * deliberately survives — it is a browsing preference, not transient state.
   */
  protected readonly query = linkedSignal<boolean, string>({
    source: () => this.isOpen(),
    computation: () => '',
  });
  protected readonly activeGroup = signal<TEmojiGroupId>('smileys');

  /**
   * Fetched on first open, never at boot: the params function is idle until
   * `isOpen`, which is what keeps ~35K of names out of every route chunk that
   * mounts a dialog. The underlying loader memoises, so closing and reopening
   * costs a resolved promise rather than a second download.
   */
  readonly #catalog = resource({
    params: () => (this.isOpen() ? this.#language.language() : undefined),
    loader: ({ params }) => loadEmojiCatalog(params),
    defaultValue: [],
  });

  protected readonly isLoading = this.#catalog.isLoading;

  /**
   * A query searches the whole catalog, because a user who types "milch" wants
   * the glass of milk wherever it is filed; with the box empty the segment
   * decides, so only one group is ever in the DOM.
   */
  protected readonly visible = computed<readonly TEmojiEntry[]>(() => {
    const groups = this.#catalog.value();
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
    this.activeGroup.set(event.detail.value as TEmojiGroupId);
  }

  protected pick(glyph: string): void {
    this.picked.emit(glyph);
    if (this.mode() === 'single') {
      this.closed.emit();
    }
  }
}
