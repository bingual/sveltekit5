import { localStorageManager } from '$lib/utils/variables';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('localStorageManager (Browser 환경)', () => {
  const mockKey = 'testKey';
  const mockValue = { name: 'test', age: 30 };

  beforeEach(() => {
    localStorage.clear();
  });

  it('객체를 localStorage에 저장할 수 있어야 한다', () => {
    const { saveToLocalStorage, loadFromLocalStorage } = localStorageManager();

    saveToLocalStorage(mockKey, mockValue);
    const storedValue = loadFromLocalStorage(mockKey);

    expect(storedValue).toEqual(mockValue);
  });

  it('존재하지 않는 키에 대해 null을 반환해야 한다', () => {
    const { loadFromLocalStorage } = localStorageManager();

    const result = loadFromLocalStorage('nonExistentKey');
    expect(result).toBeNull();
  });

  it('localStorage를 비울 수 있어야 한다', () => {
    const { saveToLocalStorage, clearLocalStorage, loadFromLocalStorage } = localStorageManager();

    saveToLocalStorage(mockKey, mockValue);
    clearLocalStorage();

    const result = loadFromLocalStorage(mockKey);
    expect(result).toBeNull();
  });
});
