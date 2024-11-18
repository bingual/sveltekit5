import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get, writable } from 'svelte/store';

export const localStorageManager = () => {
  if (!browser) {
    return {
      saveToLocalStorage: () => undefined,
      loadFromLocalStorage: () => undefined,
      clearLocalStorage: () => undefined,
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

export const useLoadMore = () => {
  const key = 'take';
  const url = get(page).url;
  const currentTake = writable(10);

  const unsubscribe = page.subscribe(($page) => {
    const url = $page.url;
    currentTake.set(Number(url.searchParams.get(key)) || 10);
  });

  const loadMoreData = async () => {
    if (!browser) return;

    currentTake.update((value) => value + 10);

    url.searchParams.set(key, String(get(currentTake)));
    await goto(url.toString(), { replaceState: true, noScroll: true });
  };

  return {
    currentTake,
    loadMoreData,
    unsubscribe,
  };
};
