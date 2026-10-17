import { BaseItem } from '../../model/base-item.types';
import { isNameTaken } from './form-rules';

const item = (id: string, name: string): BaseItem => ({ id, name }) as BaseItem;

const siblings = [item('a', 'Milch'), item('b', 'Brot')];

describe('isNameTaken', () => {
  it('refuses a name another row already carries', () => {
    expect(isNameTaken(siblings, 'Milch')).toBe(true);
    expect(isNameTaken(siblings, 'Butter')).toBe(false);
  });

  it('lets a row keep its own name, which is what makes an edit saveable', () => {
    expect(isNameTaken(siblings, 'Milch', 'a')).toBe(false);
    expect(isNameTaken(siblings, 'Milch', 'b')).toBe(true);
  });

  it('matches the way the search does, so case and padding do not smuggle a twin in', () => {
    expect(isNameTaken(siblings, '  milch  ')).toBe(true);
    expect(isNameTaken(siblings, 'MILCH')).toBe(true);
  });

  it('has nothing to refuse against an empty roster', () => {
    expect(isNameTaken([], 'Milch')).toBe(false);
  });
});
