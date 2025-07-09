import { expect, test } from 'vitest'
import * as storage from '@/storage';
import { List } from '@/types/global';

const list = {
  id: 1,
  title: 'foo',
  color: '#123456',
  description: 'bar',
  slug_public: 'abc',
  slug_private: 'xyz',
  spoiler: true,
  created: '2025-06-25T20:58:27.575817+00:00',
} as List;

test('empty storage', () => {
  expect(storage.getAllFromStorage()).toEqual([]);
  expect(storage.getAllFromStorage()).toHaveLength(0);
});

test('non existing list', () => {
  expect(storage.listIndex(list)).toBe(-1);
  expect(storage.listIndex(null)).toBe(-1);
});

test('if list exists', () => {
  expect(storage.listExists(list)).toBe(false);
});

test('adding new list to storage', () => {
  const storedList = storage.addToStorage(list);
  expect(storedList).toBeTruthy();
  expect(storedList.id).toBeUndefined();
  expect(storedList.title).toBe('foo');
  expect(storage.getAllFromStorage()).toHaveLength(1);
  expect(storage.listIndex(storedList)).toBe(0);
  expect(storage.listExists(storedList)).toBe(true);
});

test('adding existing list to storage', () => {
  expect(storage.addToStorage(storage.getAllFromStorage()[0])).toBeNull();
});

test('adding non-existing list to storage', () => {
  expect(storage.addToStorage(null)).toBeNull();
});

test('updating existing list in storage', () => {
  const storedList = storage.getAllFromStorage()[0];
  storedList.title = 'foox';
  storedList.color = '#000000';
  storedList.description = 'barx';
  storedList.spoiler = false;
  expect(storage.updateInStorage(storedList)).toBe(true);
  const updatedList = storage.getAllFromStorage()[0];
  expect(updatedList).toBeTruthy();
  expect(updatedList.title).toBe('foox');
  expect(updatedList.color).toBe('#000000');
  expect(updatedList.description).toBe('barx');
  expect(updatedList.spoiler).toBe(false);
  expect(storage.getAllFromStorage()).toHaveLength(1);
});

test('updating non-existing list in storage', () => {
  expect(storage.updateInStorage(null)).toBe(false);
  const foreignList = structuredClone(list);
  foreignList.slug_private = 'zzz';
  expect(storage.updateInStorage(foreignList)).toBe(false);
});

test('removing existing list from storage', () => {
  expect(storage.removeFromStorage(list)).toBe(true);
  expect(storage.getAllFromStorage()).toHaveLength(0);
});

test('removing non-existing list from storage', () => {
  expect(storage.removeFromStorage(null)).toBe(false);
  expect(storage.getAllFromStorage()).toHaveLength(0);
  const foreignList = structuredClone(list);
  foreignList.slug_private = 'zzz';
  expect(storage.removeFromStorage(foreignList)).toBe(false);
});
