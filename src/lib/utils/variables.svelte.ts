import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';

import { get, writable } from 'svelte/store';

export const useLoadMore = (interval = 20) => {
  const key = $state('take');
  const url = $state(page.url);

  const getTake = $derived(Number(page.url.searchParams.get(key)) || interval);
  const currentTake = writable(interval);

  const loadMoreData = async () => {
    if (!browser) return;

    currentTake.set(getTake + interval);
    url.searchParams.set(key, String(get(currentTake)));
    await goto(url.toString(), { replaceState: true, noScroll: true });
  };

  return {
    interval,
    currentTake,
    loadMoreData,
  };
};

export const generateNoDataMessage = () => {
  const url = page.url;
  return url.searchParams.size > 0 ? '일치하는 데이터가 없습니다.' : '데이터가 존재하지 않습니다.';
};
