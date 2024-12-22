<script lang="ts">
  import { dev } from '$app/environment';
  import { page } from '$app/state';

  import clsx from 'clsx';
  import { ChartOutline, CogOutline, LightbulbOutline, PenNibOutline } from 'flowbite-svelte-icons';
  import {
    Sidebar,
    SidebarDropdownWrapper,
    SidebarGroup,
    SidebarItem,
    type uiHelpers,
  } from 'svelte-5-ui-lib';

  const { sidebarUi }: { sidebarUi: ReturnType<typeof uiHelpers> } = $props();

  const userInfo = $derived(page.data.session?.user);

  const spanClass = clsx('flex-1 ms-3 whitespace-nowrap xs:text-base text-xs');
  const iconClass = clsx(
    'h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white',
  );

  let isOpen = $state(false);
  const closeDemoSidebar = sidebarUi.close;

  interface Option {
    border: boolean;
  }

  interface ChildItem {
    childLabel: string;
    childHref: string;
  }

  interface Item {
    label: string;
    href?: string;
    icon: any;
    children?: ChildItem[];
  }

  interface Section {
    options: Option[];
    items: Item[];
  }

  const sections: Section[] = $derived([
    {
      options: [{ border: false }],
      items: [
        { label: '대쉬보드', href: '/', icon: ChartOutline },
        ...(userInfo ? [{ label: '메모', href: '/memo', icon: PenNibOutline }] : []),
        {
          label: '플레이리스트',
          icon: LightbulbOutline,
          children: [{ childLabel: '멜론차트', childHref: '/playlist/melonChart' }],
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
                children: [{ childLabel: '데이터 생성/제거', childHref: '/tests/fake-data' }],
              },
            ]
          : []),
        {
          label: '설정',
          icon: CogOutline,
          children: [{ childLabel: '계정', childHref: '#' }],
        },
      ],
    },
  ]);

  $effect(() => {
    isOpen = sidebarUi.isOpen;
  });
</script>

<div class="relative">
  <Sidebar
    class="top-[61px] z-40 h-full w-52 @container xs:w-64"
    isSingle={false}
    backdrop={true}
    {isOpen}
    closeSidebar={closeDemoSidebar}
    params={{ x: -50, duration: 50 }}
    position="fixed"
    activeClass={clsx('p-2')}
    nonActiveClass={clsx('p-2')}
  >
    {#each sections as section}
      <SidebarGroup border={section.options[0].border}>
        {#each section.items as item}
          {#if item.children}
            <SidebarDropdownWrapper {spanClass} label={item.label} btnClass={clsx('p-2')}>
              {#snippet iconSlot()}
                <item.icon class={iconClass} />
              {/snippet}
              {#each item.children as child}
                <SidebarItem {spanClass} label={child.childLabel} href={child.childHref} />
              {/each}
            </SidebarDropdownWrapper>
          {:else}
            <SidebarItem {spanClass} label={item.label} href={item.href}>
              {#snippet iconSlot()}
                <item.icon class={iconClass} />
              {/snippet}
            </SidebarItem>
          {/if}
        {/each}
      </SidebarGroup>
    {/each}
  </Sidebar>
</div>
