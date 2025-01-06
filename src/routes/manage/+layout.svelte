<script lang="ts">
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import Navbar from '$lib/components/layouts/Navbar.svelte';
  import Sidebar from '$lib/components/layouts/Sidebar.svelte';

  import clsx from 'clsx';
  import {
    AnnotationOutline,
    ClipboardListOutline,
    CogOutline,
    LightbulbOutline,
  } from 'flowbite-svelte-icons';
  import { uiHelpers } from 'svelte-5-ui-lib';

  let { children } = $props();
  const sidebarUi = uiHelpers();

  const userInfo = $derived(page.data.session?.user);

  const sections: SidebarSection[] = $derived([
    {
      options: [{ border: false }],
      items: [
        {
          label: '콘텐츠',
          icon: ClipboardListOutline,
          children: [
            { childLabel: '글관리', childHref: '#' },
            { childLabel: '카테고리 관리', childHref: '#' },
            { childLabel: '공지 관리', childHref: '#' },
            { childLabel: '서식 관리', childHref: '#' },
            { childLabel: '설정', childHref: '#' },
          ],
        },
        {
          label: '댓글·방명록',
          icon: AnnotationOutline,
          children: [
            { childLabel: '댓글 관리', childHref: '#' },
            { childLabel: '방명록 관리', childHref: '#' },
            { childLabel: '공지 관리', childHref: '#' },
            { childLabel: '설정', childHref: '#' },
          ],
        },
        {
          label: '관리',
          icon: CogOutline,
          children: [{ childLabel: '블로그', childHref: '#' }],
        },
      ],
    },

    {
      options: [{ border: true }],
      items: [
        ...(dev && userInfo
          ? [
              {
                label: '테스트',
                icon: LightbulbOutline,
                children: [
                  { childLabel: '데이터 생성/제거', childHref: '/manage/tests/fake-data' },
                ],
              },
            ]
          : []),
      ],
    },
  ]);
</script>

<Navbar {sidebarUi} />

<div class="w-full dark:bg-gray-900 lg:flex">
  {#if !page.url.pathname.includes('newPost')}
    <Sidebar {sidebarUi} {sections} />
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
