import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get, writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';

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
  const interval = 20;
  const url = get(page).url;
  const currentTake = writable(interval);

  const unsubscribe = page.subscribe((value) => {
    const url = value.url;
    currentTake.set(Number(url.searchParams.get(key)) || interval);
  });

  const loadMoreData = async () => {
    if (!browser) return;

    currentTake.update((value) => value + interval);

    url.searchParams.set(key, String(get(currentTake)));
    await goto(url.toString(), { replaceState: true, noScroll: true });
  };

  return {
    interval,
    currentTake,
    loadMoreData,
    unsubscribe,
  };
};

export const generateNoDataMessage = () => {
  const url = get(page).url;
  return url.searchParams.size > 0 ? '일치하는 데이터가 없습니다.' : '데이터가 존재하지 않습니다.';
};

export const getPublicUrl = (url: string) => {
  return supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(url).data.publicUrl;
};
