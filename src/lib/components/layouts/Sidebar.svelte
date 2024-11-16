<script lang="ts">
  import {
    Sidebar,
    SidebarGroup,
    SidebarItem,
    SidebarDropdownWrapper,
    SidebarButton,
    uiHelpers,
  } from 'svelte-5-ui-lib';
  import { ChartOutline, PenNibOutline, LightbulbOutline, CogOutline } from 'flowbite-svelte-icons';
  import { useContext } from '$lib/utils/stores';

  const {
    accountStore: { userInfo },
  } = useContext();

  const spanClass = 'flex-1 ms-3 whitespace-nowrap';
  const iconClass =
    'h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white';

  const sidebarUi = uiHelpers();
  let isOpen = $state(false);
  const closeDemoSidebar = sidebarUi.close;

  interface Option {
    border: boolean;
  }

  interface Item {
    label: string;
    href?: string;
    icon: any;
    children?: [{ childLabel: string; childHref: string }];
  }

  interface Section {
    options: Option[];
    items: Item[];
  }

  let sections: Section[] = $state([
    {
      options: [{ border: false }],
      items: [
        { label: '대쉬보드', href: '/', icon: ChartOutline },
        ...($userInfo ? [{ label: '메모', href: '/memo', icon: PenNibOutline }] : []),
      ],
    },
    {
      options: [{ border: true }],
      items: [
        {
          label: '테스트',
          href: '/tests',
          icon: LightbulbOutline,
        },
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

<SidebarButton onclick={sidebarUi.toggle} class="mb-2" />
<div class="relative">
  <Sidebar
    class="top-[61px] z-50 h-full"
    isSingle={false}
    backdrop={false}
    {isOpen}
    closeSidebar={closeDemoSidebar}
    params={{ x: -50, duration: 50 }}
    position="fixed"
    activeClass="p-2"
    nonActiveClass="p-2"
  >
    {#each sections as section}
      <SidebarGroup border={section.options[0].border}>
        {#each section.items as item}
          {#if item.children}
            <SidebarDropdownWrapper label={item.label} btnClass="p-2">
              {#snippet iconSlot()}
                <item.icon class={iconClass} />
              {/snippet}
              {#each item.children as child}
                <SidebarItem label={child.childLabel} href={child.childHref} />
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
