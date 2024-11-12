<script lang="ts">
  import {
    Navbar,
    NavBrand,
    NavUl,
    NavLi,
    uiHelpers,
    NavHamburger,
    Dropdown,
    DropdownHeader,
    DropdownUl,
    DropdownLi,
    Avatar,
    DropdownFooter,
    Button,
  } from 'svelte-5-ui-lib';
  import { sineIn } from 'svelte/easing';
  import { page } from '$app/stores';
  import { SignIn, SignOut } from '@auth/sveltekit/components';
  import { useContext } from '$lib/utils/stores';

  let nav = uiHelpers();
  let navStatus = $state(false);
  let toggleNav = nav.toggle;
  let dropdownUser = uiHelpers();
  let dropdownUserStatus = $state(false);
  let closeDropdownUser = dropdownUser.close;

  let fluid = $state(true);

  const { accountStore } = useContext();
  const { userInfo } = accountStore;

  $effect(() => {
    dropdownUserStatus = dropdownUser.isOpen;
    navStatus = nav.isOpen;
  });
</script>

<div>
  <Navbar {fluid} {navStatus} hamburgerMenu={false}>
    {#snippet brand()}
      <NavBrand siteName="Adora"></NavBrand>
    {/snippet}

    {#snippet navSlotBlock()}
      <div class="flex items-center space-x-1 md:order-2">
        <!-- FIXME: dot 속성이 없거나 삼항연산자로 동적 할당할 때 버그있음 -->
        <Avatar
          onclick={dropdownUser.toggle}
          src={$userInfo?.image ? $userInfo.image : ''}
          dot={{ color: 'green' }}
        />
        <div class="relative flex justify-center">
          <Dropdown
            dropdownStatus={dropdownUserStatus}
            closeDropdown={closeDropdownUser}
            params={{ y: 0, duration: 200, easing: sineIn }}
            class="absolute top-3 w-auto -translate-x-1/2 transform"
          >
            {#if $userInfo}
              <DropdownHeader class="px-4 py-2">
                <span class="block text-sm text-gray-900 dark:text-white">{$userInfo.name}</span>
                <span class="block truncate text-sm font-medium">{$userInfo.email}</span>
              </DropdownHeader>

              <DropdownUl>
                <DropdownLi href="#">계정</DropdownLi>
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
                    redirectTo: $page.data.redirectTo
                      ? `/${decodeURIComponent($page.data.redirectTo).slice(1)}`
                      : `/`,
                  }}
                >
                  {#snippet submitButton()}
                    <Button class="whitespace-nowrap" color="dark"
                      ><img
                        class="me-2 h-6 w-6"
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

    <NavUl class="order-1">
      <NavLi href="/">대쉬보드</NavLi>
      <NavLi href="/tests">테스트</NavLi>
    </NavUl>
  </Navbar>
</div>
