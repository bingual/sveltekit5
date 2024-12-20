import { browser } from '$app/environment';
import { PUBLIC_SUPABASE_BUCKET } from '$env/static/public';
import { supabase } from '$lib/supabaseClient';

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

export const getPublicUrl = (url: string) => {
  return supabase.storage.from(PUBLIC_SUPABASE_BUCKET).getPublicUrl(url).data.publicUrl;
};
