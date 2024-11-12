import { get, writable } from 'svelte/store';
import { localStorageManager } from '$lib/utils/variables.js';
import { getContext } from 'svelte';
import { page } from '$app/stores';

const persistentStore = (key: string, startValue: any) => {
  const { loadFromLocalStorage, saveToLocalStorage } = localStorageManager();

  const storedValue = loadFromLocalStorage(key);
  const store = writable(storedValue !== undefined ? storedValue : (startValue ?? null));

  store.subscribe((value) => {
    saveToLocalStorage(key, value);
  });

  return store;
};

export const accountStore = () => {
  const userSession = get(page).data.session?.user;
  const userInfo = writable<typeof userSession | undefined>(userSession);

  return {
    userInfo,
  };
};

export const toastStore = () => {
  type Toast = {
    id: number;
    message: string;
    counter: number;
    status: boolean;
  };

  const toasts = writable<Toast[]>([]);

  const addToast = (message: string, counter = 4) => {
    const id = Date.now();
    toasts?.update((toasts) => [...toasts, { id, message, counter, status: true }]);
    decrementCounter(id);
  };

  const decrementCounter = (id: number) => {
    const interval = setInterval(() => {
      toasts?.update((toasts) => {
        return toasts.map((toast) => {
          if (toast.id === id) {
            if (toast.counter <= 1) {
              clearInterval(interval);
              return { ...toast, status: false };
            }
            return { ...toast, counter: toast.counter - 1 };
          }
          return toast;
        });
      });
    }, 1000);
  };

  const restoreCounters = () => {
    const currentToasts = get(toasts!);
    currentToasts.forEach((toast) => {
      if (toast.status && toast.counter > 0) {
        decrementCounter(toast.id);
      }
    });
  };

  const removeToast = (id: number) => {
    toasts?.update((toasts) => toasts.filter((toast) => toast.id !== id));
  };

  restoreCounters();

  return {
    toasts,
    addToast,
    removeToast,
  };
};

type ToastStore = ReturnType<typeof toastStore>;
type AccountStore = ReturnType<typeof accountStore>;
export const useContext = () => {
  const toastStore = getContext<ToastStore>('toastStore');
  const accountStore = getContext<AccountStore>('accountStore');

  return {
    toastStore,
    accountStore,
  };
};
