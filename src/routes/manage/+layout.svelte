<script>
  import { page } from '$app/state';
  import Navbar from '$lib/components/layouts/manage/Navbar.svelte';
  import Sidebar from '$lib/components/layouts/manage/Sidebar.svelte';

  import clsx from 'clsx';
  import { uiHelpers } from 'svelte-5-ui-lib';

  let { children } = $props();
  const sidebarUi = uiHelpers();
</script>

<header
  class="sticky top-0 z-50 mx-auto w-full flex-none border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
>
  <Navbar {sidebarUi} />
</header>

<div class="w-full dark:bg-gray-900 lg:flex">
  {#if !page.url.pathname.includes('newPost')}
    <Sidebar {sidebarUi} />
  {/if}
  <main
    class={clsx(
      'w-full min-w-0 lg:static lg:max-h-full lg:overflow-visible',
      !page.url.pathname.includes('newPost') && 'md:ml-64 ',
    )}
  >
    <div class="w-full">
      <div
        class="mx-auto min-w-0 max-w-7xl flex-col divide-y divide-gray-200 px-4 pb-8 pt-6 dark:divide-gray-800 lg:px-8"
      >
        {@render children()}
      </div>
    </div>
  </main>
</div>
