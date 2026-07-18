import { isProductItem, isShoppingItem, isStorageItem } from './grocery.guards';
import {
  mockProduct,
  mockShoppingItem,
  mockStorageItem,
} from '../testing/grocery.test-data';

describe('grocery.guards', () => {
  it('isProductItem detects the "unit" property', () => {
    expect(isProductItem(mockProduct())).toBe(true);
    expect(isProductItem(mockStorageItem())).toBe(false);
  });

  it('isStorageItem detects an own "bestBefore" property', () => {
    expect(isStorageItem(mockStorageItem({ bestBefore: '2024-05-01' }))).toBe(
      true
    );
    // storage item without an explicit bestBefore key is not detected
    expect(isStorageItem(mockStorageItem())).toBe(false);
    expect(isStorageItem(undefined)).toBe(false);
  });

  it('isShoppingItem detects the "state" property', () => {
    expect(isShoppingItem(mockShoppingItem())).toBe(true);
    expect(isShoppingItem(mockProduct())).toBe(false);
  });
});
