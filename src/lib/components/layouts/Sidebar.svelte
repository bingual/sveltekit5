<script lang="ts">
  import clsx from 'clsx';
  import {
    Sidebar,
    SidebarDropdownWrapper,
    SidebarGroup,
    SidebarItem,
    type uiHelpers,
  } from 'svelte-5-ui-lib';

  const {
    sidebarUi,
    sections,
  }: { sidebarUi: ReturnType<typeof uiHelpers>; sections: SidebarSection[] } = $props();

  const spanClass = clsx('flex-1 ms-3 whitespace-nowrap xs:text-base text-xs');
  const iconClass = clsx(
    'h-5 w-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white',
  );

  let isOpen = $state(false);
  const closeDemoSidebar = sidebarUi.close;

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
    divClass={clsx(
      'h-full px-3 py-4 overflow-y-auto border-e dark:border-e-gray-600 bg-white dark:bg-gray-800',
    )}
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
