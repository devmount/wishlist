import { Item, ItemState, List } from "./types/global";

const API_URL = '/api.php';

/**
 * Error returned by the API, contains the HTTP status code
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Call given API action. Reads are sent as GET with query parameters,
 * writes (if a body is given) as POST with JSON body.
 */
const request = async <T>(action: string, params: Record<string, string> = {}, body?: object): Promise<T> => {
  const query = new URLSearchParams({ action, ...params });
  const options = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined;
  const response = await fetch(`${API_URL}?${query}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? response.statusText);
  }
  return data;
};

/**
 * Slugs identifying a list, the private one is needed for admin actions
 */
const slugs = (list: List) => ({ public: list.slug_public, private: list.slug_private });

/**
 * Get list with all its items. List contains the private slug only if given correctly.
 */
export const getList = (slugPublic: string, slugPrivate?: string) => {
  const params: Record<string, string> = { public: slugPublic };
  if (slugPrivate) {
    params.private = slugPrivate;
  }
  return request<{ list: List, items: Item[] }>('list', params);
};

/**
 * Get change marker of a list, equals list.modified
 */
export const getVersion = async (slugPublic: string): Promise<string> => {
  const data = await request<{ version: string }>('version', { public: slugPublic });
  return data.version;
};

/**
 * Create new list, returns it including both slugs
 */
export const createList = (data: Pick<List, 'title' | 'color' | 'description'>) => {
  return request<List>('createList', {}, data);
};

/**
 * Update list properties, returns the updated list
 */
export const updateList = (list: List, data: Partial<Pick<List, 'title' | 'color' | 'description' | 'spoiler'>>) => {
  return request<List>('updateList', {}, { ...slugs(list), ...data });
};

/**
 * Delete list with all its items
 */
export const deleteList = (list: List) => {
  return request('deleteList', {}, slugs(list));
};

/**
 * Add new item to the end of a list, returns its id
 */
export const createItem = async (list: List, item: Partial<Item>): Promise<number> => {
  const data = await request<{ id: number }>('createItem', {}, { ...slugs(list), item });
  return data.id;
};

/**
 * Update item properties
 */
export const updateItem = (list: List, id: number, item: Partial<Item>) => {
  return request('updateItem', {}, { ...slugs(list), id, item });
};

/**
 * Delete single item
 */
export const deleteItem = (list: List, id: number) => {
  return request('deleteItem', {}, { ...slugs(list), id });
};

/**
 * Save new item order, given as list of item ids
 */
export const reorder = (list: List, ids: number[]) => {
  return request('reorder', {}, { ...slugs(list), ids });
};

/**
 * Change state of an item. Fails with status 409 if the item doesn't have
 * the given item's state anymore, because someone else changed it meanwhile.
 */
export const setState = (list: List, item: Item, state: ItemState) => {
  return request('setState', {}, { public: list.slug_public, id: item.id, from: item.state, to: state });
};

const api = {
  getList,
  getVersion,
  createList,
  updateList,
  deleteList,
  createItem,
  updateItem,
  deleteItem,
  reorder,
  setState,
};
export type Api = typeof api;
export default api;
