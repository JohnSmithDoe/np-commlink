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
import { Marker } from '../../model/app.types';
import {
  EMOJI_GROUP_IDS,
  emojiMatching,
  loadEmojiCatalog,
  EmojiEntry,
  EmojiGroupId,
} from '../../util/emoji/emoji.catalog';
import { APP_LANGUAGE } from '../../util/theme/language.boot';

type EmojiPickerMode = 'single' | 'multiple';

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
  readonly mode = input<EmojiPickerMode>('single');

  readonly picked = output<string>();
  readonly closed = output<void>();
  readonly dismissed = output<void>();

  protected readonly groupIds = EMOJI_GROUP_IDS;
  protected readonly groupLabels = GROUP_LABELS;

  protected readonly query = linkedSignal<boolean, string>({
    source: () => this.isOpen(),
    computation: () => '',
  });
  protected readonly activeGroup = signal<EmojiGroupId>('smileys');

  readonly #catalog = resource({
    params: () => (this.isOpen() ? this.#language : undefined),
    loader: ({ params }) => loadEmojiCatalog(params),
    defaultValue: [],
  });

  protected readonly isLoading = this.#catalog.isLoading;

  protected readonly visible = computed<readonly EmojiEntry[]>(() => {
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
    this.activeGroup.set(event.detail.value as EmojiGroupId);
  }

  protected pick(glyph: string): void {
    this.picked.emit(glyph);
    if (this.mode() === 'single') {
      this.closed.emit();
    }
  }
}
