import { List } from "./types/global";

/**
 * Get all existing lists from local storage. Returns an array.
 */ 
export const getAllFromStorage = (): List[] => {
  return JSON.parse(localStorage.wishlists || null) || [];
};

/**f
 * Returns list index of found entry, otherwise -1
 */
export const listIndex = (list: List): number => {
  const lists = getAllFromStorage();
  return lists.findIndex(e => e.slug_public == list.slug_public && e.slug_private == list.slug_private);
};

/**
 * True if list is already stored locally
 */
export const listExists = (list: List): boolean => {
  return listIndex(list) >= 0;
};

/**
 * Store a <list> in local storage with timestamp and slugs
 * Returns the list object if the entry was added otherweise null.
 */
export const addToStorage = (list: List): List | null => {
  const lists = getAllFromStorage();
  if (list && !listExists(list)) {
    // Remove unwanted properties
    delete list.id;
    // If that list doesn't exist yet, add and save it
    lists.push(list);
    localStorage.wishlists = JSON.stringify(lists);
    return list;
  }
  return null;
};

/**
 * Updates given list in local storage, returns true if update happened.
 */
export const updateInStorage = (list: List): boolean => {
  const lists = getAllFromStorage();
  const index = listIndex(list);
  if (index >= 0) {
    // If that list exists, update it
    lists[index] = list;
    localStorage.wishlists = JSON.stringify(lists);
    return true;
  }
  return false;
};

/**
 * Remove given list from local storage, returns true if deletion happened.
 */
export const removeFromStorage = (list: List): boolean => {
  const lists = getAllFromStorage();
  const index = listIndex(list);
  if (index >= 0) {
    // If that list exists, remove it
    lists.splice(index, 1);
    localStorage.wishlists = JSON.stringify(lists);
    return true;
  }
  return false;
};

export default {
  getAllFromStorage,
  listIndex,
  listExists,
  addToStorage,
  updateInStorage,
  removeFromStorage,
};
