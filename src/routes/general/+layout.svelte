<script lang="ts">
  import Navbar from '$lib/components/layouts/Navbar.svelte';
  import Sidebar from '$lib/components/layouts/Sidebar.svelte';

  import { ClipboardListOutline, ListMusicOutline, PenNibOutline } from 'flowbite-svelte-icons';
  import { uiHelpers } from 'svelte-5-ui-lib';

  let { children } = $props();
  const sidebarUi = uiHelpers();

  const sections: SidebarSection[] = $derived([
    {
      options: [{ border: false }],
      items: [
        { label: '소개', href: '/general', icon: ClipboardListOutline },
        { label: '포스트', href: '/general/posts', icon: PenNibOutline },
        {
          label: '플레이리스트',
          icon: ListMusicOutline,
          children: [{ childLabel: '멜론차트', childHref: '/general/playlist/melonChart' }],
        },
      ],
    },
  ]);
</script>

<Navbar {sidebarUi} />

<div class="w-full dark:bg-gray-900 lg:flex">
  <Sidebar {sidebarUi} {sections} />
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
