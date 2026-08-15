/* ─── why ─────────────────────────────────────────────────────────
 * The catalog is code, not state: it is never persisted, so growing it
 * costs no migration. What *is* persisted is the id of a finished prompt,
 * which is why an id is never reused for different wording — a completion
 * from March has to still resolve to the thing that was actually done.
 * `RitualCatalog` is a non-empty tuple so that a list which came back
 * empty fails the build rather than leaving the page with no card.
 *
 * Every entry passes one test: it cannot be half-done. "Put one book back"
 * has a moment it is finished; "tidy the shelf" does not, and a prompt
 * whose end is a judgement call cannot deliver the only thing this module
 * produces. Everything else — in the flat, under three minutes, no
 * equipment, nothing waiting on someone's reply — is a cheap proxy for it.
 * ───────────────────────────────────────────────────────────────── */
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { RitualCatalog } from './ritual.types';

export const RITUAL_PROMPTS: RitualCatalog = [
  { id: 'water', textKey: marker('ritual.prompt.water') },
  { id: 'wash-face-cold', textKey: marker('ritual.prompt.wash-face-cold') },
  { id: 'hand-cream', textKey: marker('ritual.prompt.hand-cream') },
  { id: 'roll-shoulders', textKey: marker('ritual.prompt.roll-shoulders') },
  { id: 'stretch', textKey: marker('ritual.prompt.stretch') },
  { id: 'socks-off', textKey: marker('ritual.prompt.socks-off') },
  { id: 'walk-the-flat', textKey: marker('ritual.prompt.walk-the-flat') },
  { id: 'tilt-head', textKey: marker('ritual.prompt.tilt-head') },
  { id: 'loosen-jaw', textKey: marker('ritual.prompt.loosen-jaw') },
  { id: 'feet-up', textKey: marker('ritual.prompt.feet-up') },
  { id: 'shake-hands-out', textKey: marker('ritual.prompt.shake-hands-out') },
  { id: 'sit-up-straight', textKey: marker('ritual.prompt.sit-up-straight') },
  { id: 'big-yawn', textKey: marker('ritual.prompt.big-yawn') },
  { id: 'cold-wrists', textKey: marker('ritual.prompt.cold-wrists') },

  { id: 'window', textKey: marker('ritual.prompt.window') },
  { id: 'door-wide-open', textKey: marker('ritual.prompt.door-wide-open') },
  {
    id: 'heating-one-notch',
    textKey: marker('ritual.prompt.heating-one-notch'),
  },
  { id: 'small-lamp', textKey: marker('ritual.prompt.small-lamp') },
  { id: 'lamp-to-the-wall', textKey: marker('ritual.prompt.lamp-to-the-wall') },
  { id: 'phone-on-silent', textKey: marker('ritual.prompt.phone-on-silent') },
  { id: 'move-your-chair', textKey: marker('ritual.prompt.move-your-chair') },
  { id: 'close-a-curtain', textKey: marker('ritual.prompt.close-a-curtain') },
  { id: 'everything-off', textKey: marker('ritual.prompt.everything-off') },
  { id: 'plump-pillows', textKey: marker('ritual.prompt.plump-pillows') },
  { id: 'shift-furniture', textKey: marker('ritual.prompt.shift-furniture') },

  { id: 'tidy-one-thing', textKey: marker('ritual.prompt.tidy-one-thing') },
  { id: 'book-back', textKey: marker('ritual.prompt.book-back') },
  { id: 'rinse-one-cup', textKey: marker('ritual.prompt.rinse-one-cup') },
  { id: 'bin-one-thing', textKey: marker('ritual.prompt.bin-one-thing') },
  { id: 'wipe-the-tap', textKey: marker('ritual.prompt.wipe-the-tap') },
  { id: 'one-mark-off', textKey: marker('ritual.prompt.one-mark-off') },
  {
    id: 'straighten-picture',
    textKey: marker('ritual.prompt.straighten-picture'),
  },
  { id: 'shut-a-drawer', textKey: marker('ritual.prompt.shut-a-drawer') },
  { id: 'duvet-up', textKey: marker('ritual.prompt.duvet-up') },
  { id: 'fold-one-shirt', textKey: marker('ritual.prompt.fold-one-shirt') },
  {
    id: 'laundry-in-basket',
    textKey: marker('ritual.prompt.laundry-in-basket'),
  },
  { id: 'hang-a-towel', textKey: marker('ritual.prompt.hang-a-towel') },
  {
    id: 'keys-where-they-live',
    textKey: marker('ritual.prompt.keys-where-they-live'),
  },
  { id: 'line-up-shoes', textKey: marker('ritual.prompt.line-up-shoes') },
  { id: 'pen-away', textKey: marker('ritual.prompt.pen-away') },
  { id: 'close-a-lid', textKey: marker('ritual.prompt.close-a-lid') },

  { id: 'one-song', textKey: marker('ritual.prompt.one-song') },
  { id: 'smell-a-spice', textKey: marker('ritual.prompt.smell-a-spice') },
  { id: 'one-slow-sip', textKey: marker('ritual.prompt.one-slow-sip') },
  { id: 'three-sounds', textKey: marker('ritual.prompt.three-sounds') },
  { id: 'smell-your-soap', textKey: marker('ritual.prompt.smell-your-soap') },
  {
    id: 'chew-twenty-times',
    textKey: marker('ritual.prompt.chew-twenty-times'),
  },
  {
    id: 'touch-three-fabrics',
    textKey: marker('ritual.prompt.touch-three-fabrics'),
  },
  { id: 'cold-spoon', textKey: marker('ritual.prompt.cold-spoon') },
  {
    id: 'listen-out-window',
    textKey: marker('ritual.prompt.listen-out-window'),
  },
  { id: 'warm-hand-neck', textKey: marker('ritual.prompt.warm-hand-neck') },
  {
    id: 'lights-off-a-minute',
    textKey: marker('ritual.prompt.lights-off-a-minute'),
  },
  {
    id: 'hold-something-cold',
    textKey: marker('ritual.prompt.hold-something-cold'),
  },
  {
    id: 'smell-your-sleeve',
    textKey: marker('ritual.prompt.smell-your-sleeve'),
  },
  { id: 'warm-your-hands', textKey: marker('ritual.prompt.warm-your-hands') },

  {
    id: 'three-things-outside',
    textKey: marker('ritual.prompt.three-things-outside'),
  },
  { id: 'oldest-object', textKey: marker('ritual.prompt.oldest-object') },
  {
    id: 'count-blue-things',
    textKey: marker('ritual.prompt.count-blue-things'),
  },
  { id: 'read-one-page', textKey: marker('ritual.prompt.read-one-page') },
  {
    id: 'look-at-one-photo',
    textKey: marker('ritual.prompt.look-at-one-photo'),
  },
  { id: 'count-the-lights', textKey: marker('ritual.prompt.count-the-lights') },
  {
    id: 'look-at-the-ceiling',
    textKey: marker('ritual.prompt.look-at-the-ceiling'),
  },
  { id: 'top-fridge-shelf', textKey: marker('ritual.prompt.top-fridge-shelf') },
  {
    id: 'read-three-spines',
    textKey: marker('ritual.prompt.read-three-spines'),
  },
  {
    id: 'look-at-your-palm',
    textKey: marker('ritual.prompt.look-at-your-palm'),
  },
  { id: 'read-a-label', textKey: marker('ritual.prompt.read-a-label') },
  { id: 'four-corners', textKey: marker('ritual.prompt.four-corners') },
  {
    id: 'two-shades-of-red',
    textKey: marker('ritual.prompt.two-shades-of-red'),
  },
  { id: 'year-on-a-coin', textKey: marker('ritual.prompt.year-on-a-coin') },
  { id: 'highest-point', textKey: marker('ritual.prompt.highest-point') },

  { id: 'paper-plane', textKey: marker('ritual.prompt.paper-plane') },
  { id: 'sock-basket', textKey: marker('ritual.prompt.sock-basket') },
  { id: 'draw-a-cat', textKey: marker('ritual.prompt.draw-a-cat') },
  { id: 'wrong-hand-name', textKey: marker('ritual.prompt.wrong-hand-name') },
  { id: 'fold-until-stuck', textKey: marker('ritual.prompt.fold-until-stuck') },
  { id: 'walk-backwards', textKey: marker('ritual.prompt.walk-backwards') },
  {
    id: 'slow-motion-steps',
    textKey: marker('ritual.prompt.slow-motion-steps'),
  },
  { id: 'balance-a-book', textKey: marker('ritual.prompt.balance-a-book') },
  { id: 'dance-one-song', textKey: marker('ritual.prompt.dance-one-song') },
  { id: 'three-faces', textKey: marker('ritual.prompt.three-faces') },
  { id: 'hum-a-theme', textKey: marker('ritual.prompt.hum-a-theme') },
  { id: 'word-ten-times', textKey: marker('ritual.prompt.word-ten-times') },
  {
    id: 'tap-happy-birthday',
    textKey: marker('ritual.prompt.tap-happy-birthday'),
  },
  { id: 'newsreader-voice', textKey: marker('ritual.prompt.newsreader-voice') },
  { id: 'name-an-object', textKey: marker('ritual.prompt.name-an-object') },
  { id: 'rename-the-wifi', textKey: marker('ritual.prompt.rename-the-wifi') },
  { id: 'title-for-today', textKey: marker('ritual.prompt.title-for-today') },

  { id: 'reach-out', textKey: marker('ritual.prompt.reach-out') },
  { id: 'reply-oldest', textKey: marker('ritual.prompt.reply-oldest') },
  { id: 'react-with-emoji', textKey: marker('ritual.prompt.react-with-emoji') },
  { id: 'send-last-photo', textKey: marker('ritual.prompt.send-last-photo') },
  { id: 'send-a-link', textKey: marker('ritual.prompt.send-a-link') },
  {
    id: 'forward-something-funny',
    textKey: marker('ritual.prompt.forward-something-funny'),
  },
  { id: 'send-a-song', textKey: marker('ritual.prompt.send-a-song') },
  { id: 'photo-from-here', textKey: marker('ritual.prompt.photo-from-here') },
  { id: 'three-emojis', textKey: marker('ritual.prompt.three-emojis') },
  {
    id: 'one-line-about-today',
    textKey: marker('ritual.prompt.one-line-about-today'),
  },
  { id: 'thumbs-up', textKey: marker('ritual.prompt.thumbs-up') },
];
