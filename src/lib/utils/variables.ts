import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get, writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
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

export const useLoadMore = () => {
  const key = 'take';
  const interval = 10;
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

// TODO: 이미지 최적화 기능 구현 (vite와 호환되는 마땅한 라이브러리가 없음)
export const storageManager = () => {
  const bucket_name = 'adora';
  const getFileExtension = (fileName: string): string => {
    return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
  };

  const uploadPublicStorage = async (file: File, dir: string) => {
    const fileExtension = getFileExtension(file.name);
    const filePath = `${dir}/${uuidv4()}.${fileExtension}`;

    const { data, error } = await supabase.storage.from(bucket_name).upload(filePath, file, {
      contentType: 'image/jpeg',
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.path;
  };

  const removePublicStorageFile = async (paths: string[]) => {
    const { data, error } = await supabase.storage.from(bucket_name).remove(paths);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const getPublicUrl = (url: string) => {
    return supabase.storage.from(bucket_name).getPublicUrl(url).data.publicUrl;
  };

  return {
    getPublicUrl,
    uploadPublicStorage,
    removePublicStorageFile,
  };
};
