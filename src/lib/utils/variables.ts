import { browser } from '$app/environment';

export const localStorageManager = () => {
  if (!browser) {
    return {
      saveToLocalStorage: () => {},
      loadFromLocalStorage: () => null,
      clearLocalStorage: () => {},
    };
  }

  const saveToLocalStorage = (key: string, value: any) => {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  };

  const loadFromLocalStorage = (key: string) => {
    const jsonValue = localStorage.getItem(key);
    return jsonValue ? JSON.parse(jsonValue) : null;
  };

  const clearLocalStorage = () => {
    localStorage.clear();
  };

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
  };
};
