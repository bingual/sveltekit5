<script lang="ts">
  import Spinner from '$lib/components/layouts/Spinner.svelte';
  import Toast from '$lib/components/layouts/Toast.svelte';
  import { isLoading, modalStore, toastStore, useContext } from '$lib/utils/stores';

  import { setContext } from 'svelte';

  import 'highlight.js/styles/atom-one-dark.css';
  import '@/app.scss';

  let { children } = $props();

  setContext('toastStore', toastStore());
  setContext('modalStore', modalStore());
  setContext('isLoading', isLoading());

  const {
    toastStore: ContextToastStore,
    modalStore: ContextModalStore,
    isLoading: ContextIsLoading,
  } = useContext();
  const { toasts } = ContextToastStore;
  const { modalState, resetModal } = ContextModalStore;

  const { modalUi, currentModalName, modalNames } = modalState();

  let ModalComponent: any = $state();

  const loadComponent = async (name: string) => {
    switch (name) {
      case modalNames.SetPost:
        ModalComponent = (await import('$lib/components/modals/SetPost.svelte')).default;
        break;
      case modalNames.SetVideo:
        ModalComponent = (await import('$lib/components/modals/SetVideo.svelte')).default;
        break;
      default:
        return undefined;
    }
  };

  $effect(() => {
    if ($currentModalName) {
      loadComponent($currentModalName);
    }

    if (!modalUi.isOpen) {
      resetModal();
    }
  });
</script>

{@render children()}

{#if ModalComponent}
  {@render ModalComponent()}
{/if}

{#if $toasts}
  <Toast />
{/if}

{#if $ContextIsLoading}
  <Spinner />
{/if}
