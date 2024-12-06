import { localStorageManager } from '$lib/utils/variables.js';

import { filter, forEach, map } from 'remeda';
import { getContext } from 'svelte';
import { get, type Writable, writable } from 'svelte/store';
import { uiHelpers } from 'svelte-5-ui-lib';

const persistentStore = (key: string, startValue: any) => {
  const { loadFromLocalStorage, saveToLocalStorage } = localStorageManager();

  const storedValue = loadFromLocalStorage(key);
  const store = writable(storedValue ? storedValue : startValue);

  store.subscribe((value) => {
    saveToLocalStorage(key, value);
  });

  return store;
};

export const toastStore = () => {
  type Toast = {
    id: number;
    message: string;
    counter: number;
    status: boolean;
  };

  const toasts: Writable<Toast[]> = persistentStore('toasts', []);

  const addToast = (message: string, counter = 4) => {
    const id = Date.now();
    toasts?.update((toasts) => [...toasts, { id, message, counter, status: true }]);
    decrementCounter(id);
  };

  const decrementCounter = (id: number) => {
    const interval = setInterval(() => {
      toasts?.update((toasts) => {
        return map(toasts, (toast) => {
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
    const currentToasts = get(toasts);

    forEach(currentToasts, (toast) => {
      if (toast.status && toast.counter > 0) {
        decrementCounter(toast.id);
      }
    });
  };

  const removeToast = (id: number) => {
    toasts?.update((toasts) => filter(toasts, (toast) => toast.id !== id));
  };

  restoreCounters();

  return {
    toasts,
    addToast,
    removeToast,
  };
};

export const modalStore = () => {
  const modalNames = {
    SetMemo: 'SetMemo',
    SetVideo: 'SetVideo',
  } as const;

  type ModalName = (typeof modalNames)[keyof typeof modalNames] | '';
  type DefaultState = {
    currentModalName: ModalName;
    modalTitle: string;
    modalButtonLabels: {
      confirm?: string;
      cancel?: string;
    };
    modalProps?: { data?: any; action?: ActionType };
  };

  const defaultState: DefaultState = {
    currentModalName: '',
    modalTitle: '',
    modalButtonLabels: { confirm: '확인', cancel: '취소' },
    modalProps: undefined,
  };

  const currentModalName = writable(defaultState.currentModalName);

  const modalUi = uiHelpers();
  const modalTitle = writable(defaultState.modalTitle);
  const modalButtonLabels = writable(defaultState.modalButtonLabels);
  const modalProps = writable<DefaultState['modalProps']>(defaultState.modalProps);

  const modalState = () => {
    return {
      currentModalName,

      modalNames,
      modalUi,
      modalTitle,
      modalButtonLabels,
      modalProps,
    };
  };

  const setModal = (
    name: DefaultState['currentModalName'],
    title?: DefaultState['modalTitle'],
    buttons?: DefaultState['modalButtonLabels'],
    props?: DefaultState['modalProps'],
  ) => {
    currentModalName.set(name);
    modalUi.toggle();

    if (title) modalTitle.set(title);
    if (buttons) modalButtonLabels.set(buttons);
    if (props) modalProps.set(props);
  };

  const resetModal = () => {
    currentModalName.set(defaultState.currentModalName);

    modalTitle.set(defaultState.modalTitle);
    modalButtonLabels.set(defaultState.modalButtonLabels);
    modalProps.set(defaultState.modalProps);
  };

  return {
    modalState,
    setModal,
    resetModal,
  };
};

export const isLoading = () => writable(false);

type ToastStore = ReturnType<typeof toastStore>;
type ModalStore = ReturnType<typeof modalStore>;
type IsLoading = ReturnType<typeof isLoading>;
export const useContext = () => {
  const toastStore = getContext<ToastStore>('toastStore');
  const modalStore = getContext<ModalStore>('modalStore');
  const isLoading = getContext<IsLoading>('isLoading');

  return {
    toastStore,
    modalStore,
    isLoading,
  };
};
