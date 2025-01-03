<script>
  import Navbar from '$lib/components/layouts/Navbar.svelte';
  import Sidebar from '$lib/components/layouts/Sidebar.svelte';

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
  <Sidebar {sidebarUi} />
  <main class="w-full min-w-0 md:ml-64 lg:static lg:max-h-full lg:overflow-visible">
    <div class="w-full">
      <div
        class="mx-auto min-w-0 max-w-7xl flex-col divide-y divide-gray-200 px-4 pb-8 pt-6 dark:divide-gray-800 lg:px-8"
      >
        {@render children()}
      </div>
    </div>
  </main>
</div>
