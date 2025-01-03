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

  const sidebarUi = uiHelpers();

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

<header
  class="sticky top-0 z-50 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
>
  <Navbar {sidebarUi} />
</header>

<div class="w-full dark:bg-gray-900 lg:flex">
  <Sidebar {sidebarUi} />
  <main class="w-full min-w-0 md:ml-64 lg:static lg:max-h-full lg:overflow-visible">
    <div class="w-full">
      <div
        class="mx-auto min-w-0 max-w-7xl flex-col divide-y divide-gray-200 px-4 pb-8 pt-6 dark:divide-gray-800 lg:px-8"
      >
        <ParaglideJS {i18n}>
          {@render children()}
        </ParaglideJS>
      </div>
    </div>
  </main>
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
