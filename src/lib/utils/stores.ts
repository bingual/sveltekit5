import { get, type Writable, writable } from 'svelte/store';
import { localStorageManager } from '$lib/utils/variables.js';
import { getContext } from 'svelte';
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

export const modalStore = () => {
  const modalNames = {
    SetMemo: 'SetMemo',
  } as const;

  type ModalNameType = (typeof modalNames)[keyof typeof modalNames] | '';
  type DefaultValueType = {
    currentModalName: ModalNameType;
    modalTitle: string;
    modalButtonLabels: {
      confirm?: string;
      cancel?: string;
    };
    modalProps?: { data?: any; action?: ActionType };
  };

  const defaultValue: DefaultValueType = {
    currentModalName: '',
    modalTitle: '',
    modalButtonLabels: { confirm: '확인', cancel: '취소' },
    modalProps: undefined,
  };

  const currentModalName = writable(defaultValue.currentModalName);

  const modalUi = uiHelpers();
  const modalTitle = writable(defaultValue.modalTitle);
  const modalButtonLabels = writable(defaultValue.modalButtonLabels);
  const modalProps = writable<DefaultValueType['modalProps']>(defaultValue.modalProps);

  const modalState = () => {
    return {
      currentModalName,
      modalUi,
      modalNames,
      modalProps,
    };
  };

  const setModal = () => {
    const activeModal = (
      name: DefaultValueType['currentModalName'],
      title?: DefaultValueType['modalTitle'],
      buttons?: DefaultValueType['modalButtonLabels'],
      props?: any,
    ) => {
      currentModalName.set(name);
      modalUi.toggle();

      if (title) modalTitle.set(title);
      if (buttons) modalButtonLabels.set(buttons);
      if (props) modalProps.set(props);
    };

    return {
      modalTitle,
      modalButtonLabels,
      activeModal,
    };
  };

  const resetModal = () => {
    currentModalName.set(defaultValue.currentModalName);

    modalTitle.set(defaultValue.modalTitle);
    modalButtonLabels.set(defaultValue.modalButtonLabels);
    modalProps.set(defaultValue.modalProps);
  };

  return {
    modalState,
    setModal,
    resetModal,
  };
};

type ToastStore = ReturnType<typeof toastStore>;
type ModalStore = ReturnType<typeof modalStore>;
export const useContext = () => {
  const toastStore = getContext<ToastStore>('toastStore');
  const modalStore = getContext<ModalStore>('modalStore');

  return {
    toastStore,
    modalStore,
  };
};
