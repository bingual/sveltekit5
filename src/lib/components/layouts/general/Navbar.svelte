<script lang="ts">
  import { page } from '$app/state';

  import { SignIn, SignOut } from '@auth/sveltekit/components';
  import clsx from 'clsx';
  import { sineIn } from 'svelte/easing';
  import {
    Avatar,
    Button,
    Darkmode,
    Dropdown,
    DropdownFooter,
    DropdownHeader,
    DropdownLi,
    DropdownUl,
    Img,
    Navbar,
    NavBrand,
    NavHamburger,
    NavLi,
    NavUl,
    uiHelpers,
  } from 'svelte-5-ui-lib';

  const userInfo = $derived(page.data.session?.user);

  const { sidebarUi }: { sidebarUi: ReturnType<typeof uiHelpers> } = $props();

  // for navbar
  let nav = uiHelpers();
  let navStatus = $state(false);
  let dropdownUser = uiHelpers();
  let dropdownUserStatus = $state(false);
  let closeDropdownUser = dropdownUser.close;
  let fluid = $state(true);

  // for sidebar
  let toggleNav = sidebarUi.toggle;

  $effect(() => {
    dropdownUserStatus = dropdownUser.isOpen;
    navStatus = nav.isOpen;
  });

  let dummy = $state(false);
</script>

<div>
  <Navbar
    navClass={clsx(
      'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 px-2 sm:px-4 w-full',
    )}
    {fluid}
    {navStatus}
    hamburgerMenu={false}
  >
    {#snippet brand()}
      <NavBrand href="/general" siteName="Adora">
        <Img imgClass={clsx('w-10')} src="/images/Adora.png" alt="svelte icon" />
      </NavBrand>
    {/snippet}

    {#snippet navSlotBlock()}
      <div class="flex items-center space-x-1 md:order-2">
        <Darkmode class="me-3 text-primary-500 dark:border-gray-800 dark:text-primary-600" />
        <!-- FIXME: dot 속성이 없거나 삼항연산자로 동적 할당할 때 버그있음 -->
        <Avatar
          onclick={dropdownUser.toggle}
          src={userInfo?.image ? userInfo.image : ''}
          dot={{ color: 'green' }}
        />
        <div class="relative flex justify-center">
          <Dropdown
            dropdownStatus={dropdownUserStatus}
            closeDropdown={closeDropdownUser}
            params={{ y: 0, duration: 200, easing: sineIn }}
            class="absolute top-3 w-auto -translate-x-1/2 transform"
          >
            {#if userInfo}
              <DropdownHeader class="px-4 py-2">
                <span class="block text-sm text-gray-900 dark:text-white">{userInfo.name}</span>
                <span class="block truncate text-sm font-medium">{userInfo.email}</span>
              </DropdownHeader>

              <DropdownUl>
                <DropdownLi href="/manage">관리</DropdownLi>
                <DropdownLi href="/manage/newPost">글쓰기</DropdownLi>
              </DropdownUl>

              <DropdownFooter class="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                <SignOut signOutPage="auth?/signOut" options={{ redirect: true }}>
                  {#snippet submitButton()}
                    <span>로그아웃</span>
                  {/snippet}
                </SignOut>
              </DropdownFooter>
            {:else}
              <DropdownHeader class="px-4 py-2">
                <SignIn
                  provider="github"
                  signInPage="auth?/signIn"
                  options={{
                    redirectTo: page.data.redirectTo
                      ? `/${decodeURIComponent(page.data.redirectTo).slice(1)}`
                      : `/`,
                  }}
                >
                  {#snippet submitButton()}
                    <Button class="whitespace-nowrap" color="dark"
                      ><img
                        class="me-2 h-5 w-5"
                        src="/provider/github-mark-white.svg"
                        alt="github mark"
                      />
                      Github 로그인</Button
                    >
                  {/snippet}
                </SignIn>
              </DropdownHeader>
            {/if}
          </Dropdown>
        </div>
        <NavHamburger {toggleNav} />
      </div>
    {/snippet}

    {#if dummy}
      <NavUl class="order-1">
        <NavLi href="/">dummy</NavLi>
      </NavUl>
    {/if}
  </Navbar>
</div>
