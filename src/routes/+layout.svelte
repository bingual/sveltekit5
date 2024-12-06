<script lang="ts">
  import Navbar from '$lib/components/layouts/Navbar.svelte';
  import Sidebar from '$lib/components/layouts/Sidebar.svelte';
  import Spinner from '$lib/components/layouts/Spinner.svelte';
  import Toast from '$lib/components/layouts/Toast.svelte';
  import { i18n } from '$lib/i18n';
  import { isLoading, modalStore, toastStore, useContext } from '$lib/utils/stores';

  import { ParaglideJS } from '@inlang/paraglide-sveltekit';
  import { setContext } from 'svelte';
  import { uiHelpers } from 'svelte-5-ui-lib';

  import '@/app.pcss';

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

  const sidebarUi = uiHelpers();

  let ModalComponent: any = $state();

  const loadComponent = async (name: string) => {
    switch (name) {
      case modalNames.SetMemo:
        ModalComponent = (await import('$lib/components/modals/SetMemo.svelte')).default;
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

<header
  class="fixed top-0 z-40 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
>
  <Navbar {sidebarUi} />
</header>

<div class="overflow-hidden lg:flex">
  <Sidebar {sidebarUi} />
  <div class="relative h-full w-full overflow-y-auto px-6 pb-4 pt-20 md:ml-64">
    <ParaglideJS {i18n}>
      {@render children()}
    </ParaglideJS>
  </div>
</div>

{#if ModalComponent}
  {@render ModalComponent()}
{/if}

{#if $toasts}
  <Toast />
{/if}

{#if $ContextIsLoading}
  <Spinner />
{/if}
