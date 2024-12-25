import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';

export const useLoadMore = () => {
  const key = 'take';
  const interval = 20;
  const url = page.url;
  const getTake = $derived(Number(page.url.searchParams.get(key)) || interval);

  const loadMoreData = async () => {
    if (!browser) return;

    const currentTake = getTake + interval;

    url.searchParams.set(key, String(currentTake));
    await goto(url.toString(), { replaceState: true, noScroll: true });
  };

  return {
    interval,
    currentTake: getTake,
    loadMoreData,
  };
};

export const generateNoDataMessage = () => {
  const url = page.url;
  return url.searchParams.size > 0 ? '일치하는 데이터가 없습니다.' : '데이터가 존재하지 않습니다.';
};
