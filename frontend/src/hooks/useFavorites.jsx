import { createContext, useContext, useEffect, useState } from 'react';

const Favorites = createContext(null);
const storageKey = 'practice.catalog.favorites';

function readIds() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value)
      ? [...new Set(value.filter((id) => Number.isSafeInteger(id) && id > 0))]
      : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(readIds);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {
      // The current tab still works when browser storage is disabled.
    }
  }, [ids]);

  function toggle(id) {
    setIds((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  }

  return <Favorites.Provider value={{ ids, toggle }}>{children}</Favorites.Provider>;
}

export function useFavorites() {
  return useContext(Favorites);
}
