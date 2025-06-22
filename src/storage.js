/**
 * Get all existing lists from local storage. Returns an array.
 */ 
export const getAllFromStorage = () => {
  return JSON.parse(localStorage.wishlists || null) || [];
};

/**
 * Returns list index of found entry, otherwise -1
 */
export const listIndex = (list) => {
  const lists = getAllFromStorage();
  return lists.findIndex(e => e.slug_public == list.slug_public && e.slug_private == list.slug_private);
};

/**
 * Store a <list> in local storage with timestamp and slugs
 * Returns the list object if the entry was added otherweise null.
 */
export const addToStorage = (list) => {
  const lists = getAllFromStorage();
  if (listIndex(list) < 0) {
    // If that list doesn't exist yet, add and save it
    lists.push(list);
    localStorage.wishlists = JSON.stringify(lists)
    return list;
  }
  return null;
};

/**
 * Remove given list from local storage, returns true if deletion happened.
 */
export const removeFromStorage = (list) => {
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
  addToStorage,
  removeFromStorage,
};
