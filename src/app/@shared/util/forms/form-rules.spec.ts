import { BaseItem } from '../../model/base-item.types';
import { nameIsTaken } from './form-rules';

const item = (id: string, name: string): BaseItem => ({ id, name }) as BaseItem;

const siblings = [item('a', 'Milch'), item('b', 'Brot')];

describe('nameIsTaken', () => {
  it('refuses a name another row already carries', () => {
    expect(nameIsTaken(siblings, 'Milch')).toBe(true);
    expect(nameIsTaken(siblings, 'Butter')).toBe(false);
  });

  it('lets a row keep its own name, which is what makes an edit saveable', () => {
    expect(nameIsTaken(siblings, 'Milch', 'a')).toBe(false);
    expect(nameIsTaken(siblings, 'Milch', 'b')).toBe(true);
  });

  it('matches the way the search does, so case and padding do not smuggle a twin in', () => {
    expect(nameIsTaken(siblings, '  milch  ')).toBe(true);
    expect(nameIsTaken(siblings, 'MILCH')).toBe(true);
  });

  it('has nothing to refuse against an empty roster', () => {
    expect(nameIsTaken([], 'Milch')).toBe(false);
  });
});
