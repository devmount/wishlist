import { expect, test, vi, beforeEach } from 'vitest'
import * as api from '@/api';
import { Item, ItemState, List } from '@/types/global';

const list = {
  id: 1,
  title: 'foo',
  color: '#123456',
  description: 'bar',
  slug_public: 'abc',
  slug_private: 'xyz',
  spoiler: false,
  created: '2026-11-05T20:00:00Z',
  modified: '2026-11-05T20:00:00.123456Z',
} as List;

const item = {
  id: 7,
  list: 1,
  title: 'wish',
  description: null,
  links: ['https://example.com'],
  price: null,
  state: ItemState.Open,
  weight: 0,
  created: '2026-11-05T20:00:00Z',
  modified: '2026-11-05T20:00:00.123456Z',
} as Item;

// Mock fetch to respond with given data and status, returns mock to inspect calls
const mockFetch = (data: unknown, status = 200) => {
  const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status }));
  vi.stubGlobal('fetch', mock);
  return mock;
};

// Get parsed url and request options of first fetch call
const firstCall = (mock: ReturnType<typeof vi.fn>) => {
  const [url, options] = mock.mock.calls[0];
  return { url: new URL(url, 'http://localhost'), options, body: options?.body ? JSON.parse(options.body) : null };
};

beforeEach(() => {
  vi.unstubAllGlobals();
});

test('get list as visitor', async () => {
  const mock = mockFetch({ list, items: [item] });
  const data = await api.getList('abc');
  const { url, options } = firstCall(mock);
  expect(url.pathname).toBe('/api.php');
  expect(url.searchParams.get('action')).toBe('list');
  expect(url.searchParams.get('public')).toBe('abc');
  expect(url.searchParams.has('private')).toBe(false);
  expect(options).toBeUndefined();
  expect(data.list.title).toBe('foo');
  expect(data.items).toHaveLength(1);
});

test('get list as admin', async () => {
  const mock = mockFetch({ list, items: [] });
  await api.getList('abc', 'xyz');
  expect(firstCall(mock).url.searchParams.get('private')).toBe('xyz');
});

test('get version', async () => {
  const mock = mockFetch({ version: list.modified });
  expect(await api.getVersion('abc')).toBe(list.modified);
  expect(firstCall(mock).url.searchParams.get('action')).toBe('version');
});

test('create list', async () => {
  const mock = mockFetch(list);
  const created = await api.createList({ title: 'foo', color: '#123456', description: 'bar' });
  const { url, options, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('createList');
  expect(options.method).toBe('POST');
  expect(body).toEqual({ title: 'foo', color: '#123456', description: 'bar' });
  expect(created.slug_private).toBe('xyz');
});

test('update list sends slugs and data', async () => {
  const mock = mockFetch(list);
  await api.updateList(list, { spoiler: true });
  const { url, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('updateList');
  expect(body).toEqual({ public: 'abc', private: 'xyz', spoiler: true });
});

test('delete list', async () => {
  const mock = mockFetch({ deleted: true });
  await api.deleteList(list);
  const { url, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('deleteList');
  expect(body).toEqual({ public: 'abc', private: 'xyz' });
});

test('create item', async () => {
  const mock = mockFetch({ id: 8 });
  const id = await api.createItem(list, { title: 'new', links: [] });
  const { url, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('createItem');
  expect(body).toEqual({ public: 'abc', private: 'xyz', item: { title: 'new', links: [] } });
  expect(id).toBe(8);
});

test('update item', async () => {
  const mock = mockFetch({ updated: true });
  await api.updateItem(list, 7, { title: 'changed' });
  const { url, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('updateItem');
  expect(body).toEqual({ public: 'abc', private: 'xyz', id: 7, item: { title: 'changed' } });
});

test('delete item', async () => {
  const mock = mockFetch({ deleted: true });
  await api.deleteItem(list, 7);
  expect(firstCall(mock).body).toEqual({ public: 'abc', private: 'xyz', id: 7 });
});

test('reorder items', async () => {
  const mock = mockFetch({ updated: true });
  await api.reorder(list, [3, 1, 2]);
  const { url, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('reorder');
  expect(body).toEqual({ public: 'abc', private: 'xyz', ids: [3, 1, 2] });
});

test('set state sends current state and only public slug', async () => {
  const mock = mockFetch({ state: 'reserved' });
  await api.setState({ slug_public: 'abc' } as List, item, ItemState.Reserved);
  const { url, body } = firstCall(mock);
  expect(url.searchParams.get('action')).toBe('setState');
  expect(body).toEqual({ public: 'abc', id: 7, from: 'open', to: 'reserved' });
});

test('conflict throws api error with status', async () => {
  mockFetch({ error: 'State was changed in the meantime' }, 409);
  const request = api.setState(list, item, ItemState.Reserved);
  await expect(request).rejects.toBeInstanceOf(api.ApiError);
  await expect(request).rejects.toMatchObject({ status: 409, message: 'State was changed in the meantime' });
});

test('non json error response throws api error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Fatal error', { status: 500 })));
  const request = api.getList('abc');
  await expect(request).rejects.toBeInstanceOf(api.ApiError);
  await expect(request).rejects.toMatchObject({ status: 500 });
});
