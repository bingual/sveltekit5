<script lang="ts">
  import { i18n } from '$lib/i18n';
  import { ParaglideJS } from '@inlang/paraglide-sveltekit';
  import '@/app.pcss';
  import { setContext } from 'svelte';
  import Navbar from '$lib/components/layouts/Navbar.svelte';
  import Sidebar from '$lib/components/layouts/Sidebar.svelte';
  import Toast from '$lib/components/layouts/Toast.svelte';
  import { modalStore, toastStore, useContext } from '$lib/utils/stores';

  let { children } = $props();
  setContext('toastStore', toastStore());
  setContext('modalStore', modalStore());

  const { toastStore: ContextToastStore, modalStore: ContextModalStore } = useContext();
  const { toasts } = ContextToastStore;
  const { modalState, resetModal } = ContextModalStore;

  const { modalUi, currentModalName, modalNames } = modalState();

  let ModalComponent: any = $state();

  const loadComponent = async (name: string) => {
    switch (name) {
      case modalNames.SetMemo:
        ModalComponent = (await import('$lib/components/modals/SetMemo.svelte')).default;
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
  <Navbar />
</header>

<div class="overflow-hidden lg:flex">
  <Sidebar />
  <div class="relative h-full w-full overflow-y-auto px-2 pt-[70px] md:ml-64 lg:ml-72">
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
