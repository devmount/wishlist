import { expect, test } from 'vitest'
import { ItemState } from '@/types/global';

test('item states', () => {
  expect(Object.values(ItemState)).toEqual(['open', 'reserved', 'purchased']);
});
