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
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
  import { sineIn } from 'svelte/easing';
  import { page } from '$app/stores';
  import { SignIn, SignOut } from '@auth/sveltekit/components';
  import { dev } from '$app/environment';

  const userInfo = $derived($page.data.session?.user);

  // for navbar
  let nav = uiHelpers();
  let navStatus = $state(false);
  let toggleNav = nav.toggle;
  let dropdownUser = uiHelpers();
  let dropdownUserStatus = $state(false);
  let closeDropdownUser = dropdownUser.close;
  let fluid = $state(true);

  // for Dropdown
  let dropdown = uiHelpers();
  let dropdownStatus = $state(false);
  let closeDropdown = dropdown.close;

  $effect(() => {
    dropdownUserStatus = dropdownUser.isOpen;
    dropdownStatus = dropdown.isOpen;
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

    <!-- TODO: 나중에 햄버거 메뉴 클릭 시 Sidebar 컴포넌트 불러올 예정, 지금은 svelte-5-ui-lib 베타버전이라 NavUl이 필수 값이라 사용중. -->
    <NavUl class="order-1">
      <NavLi href="/">대쉬보드</NavLi>
      {#if userInfo}
        <NavLi href="/memo">메모</NavLi>
        {#if dev}
          <NavLi class="cursor-pointer" onclick={dropdown.toggle}
            >테스트<ChevronDownOutline
              class="ms-2 inline h-6 w-6 text-primary-800 dark:text-white"
            /></NavLi
          >
        {/if}
        <div class="relative">
          <Dropdown
            {dropdownStatus}
            {closeDropdown}
            class="absolute -top-[20px] left-[100px] md:-left-[170px] md:top-[20px]"
          >
            <DropdownUl>
              <DropdownLi href="/tests/fake-data">데이터 생성/삭제</DropdownLi>
            </DropdownUl>
          </Dropdown>
        </div>
      {/if}
    </NavUl>
  </Navbar>
</div>
