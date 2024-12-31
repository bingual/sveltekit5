import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';

import { get, writable } from 'svelte/store';

export const useLoadMore = (interval = 20) => {
  const key = $state('take');
  const pageUrl = $derived(page.url);
  const currentTake = writable(interval);

  const loadMoreData = async () => {
    if (!browser) return;

    currentTake.update((take) => take + interval);

    const updatedTake = String(get(currentTake));

    if (pageUrl.searchParams.has(key)) {
      pageUrl.searchParams.set(key, updatedTake);
    } else {
      pageUrl.searchParams.append(key, updatedTake);
    }

    await goto(pageUrl.toString(), { replaceState: true, noScroll: true, invalidateAll: true });
  };

  const resetTake = () => {
    if (!pageUrl.searchParams.get(key)) {
      currentTake.set(interval);
    }
  };

  return {
    interval,
    currentTake,
    loadMoreData,
    resetTake,
  };
};

export const generateNoDataMessage = () => {
  const url = page.url;
  return url.searchParams.size > 0 ? '일치하는 데이터가 없습니다.' : '데이터가 존재하지 않습니다.';
};
