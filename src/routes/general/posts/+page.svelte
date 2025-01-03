<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { actionMap } from '$lib/utils/mapping';
  import type { PostWithImages } from '$lib/utils/prismaTypes';
  import { useContext } from '$lib/utils/stores';
  import { getPublicUrl } from '$lib/utils/variables';
  import {
    generateNoDataMessage,
    handlePostModal,
    useLoadMore,
  } from '$lib/utils/variables.svelte.js';

  import { Render } from '@jill64/svelte-sanitize';
  import { EditOutline, EyeOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { isEmpty } from 'remeda';
  import { Button, Card, Heading, Input, P } from 'svelte-5-ui-lib';

  import type { ActionData, PageData, SubmitFunction } from './$types';

  const {
    modalStore: { setModal },
    toastStore: { addToast },
    isLoading,
  } = useContext();

  const { interval, currentTake, loadMoreData, resetTake } = useLoadMore();

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const userInfo = $derived(page.data.session?.user);
  const isPosts = $derived(isEmpty(data.posts));
  const noDataMessage = $derived(generateNoDataMessage());

  const items = [
    {
      name: '제목',
      value: 'title',
    },
    { name: '내용', value: 'content' },
  ];

  const handleDelete: SubmitFunction = ({ cancel }) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      isLoading.set(true);
      return async ({ result, update }) => {
        if (result.type === 'failure') {
          const validRes = result.data as ValidationResponse;
          if (!validRes?.success && !isEmpty(validRes.errors)) {
            addToast(validRes?.errors.join('\n'));
          }
        } else {
          await update();
        }
        isLoading.set(false);
      };
    } else {
      cancel();
    }
  };

  const extractPlainText = (content: string) => {
    if (!content) return '';

    const plainText = content.replace(/<\/?[^>]+(>|$)/g, ' ');
    return plainText.replace(/[\r\n]+/g, ' ').trim();
  };

  const extractThumbnail = (post: PostWithImages) => {
    if (post?.images?.[0]?.url) {
      return post.images[0].url.startsWith('https://')
        ? post.images[0].url
        : getPublicUrl(post.images[0].url);
    }

    const regex = /<img[^>]*src=["']([^"']+)["']/i;
    const match = post.content.match(regex);

    return match ? match[1] : '/images/noImage.jpg';
  };

  $effect(() => {
    resetTake();
  });

  $effect(() => {
    if (form?.success) {
      const title = `'${form.data?.title}'`;
      const action = actionMap(form.action).toastLabel;
      const toastMessage = `${title}을 ${action}하였습니다.`;
      addToast(toastMessage, form.action === 'delete' ? 'red' : 'green');
    }
  });
</script>

<div class="min-h-screen @container">
  <SearchBar {items} />

  {#if !isPosts}
    <!-- 그리드 -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {#each data.posts as post}
        <Card
          class="relative"
          size="md"
          img={{
            src: extractThumbnail(post),
            alt: post.title || 'Default Title',
          }}
        >
          <div class="pb-16">
            <Heading class="mb-5 line-clamp-2 whitespace-pre-line" tag="h3">{post.title}</Heading>

            <P class="line-clamp-4 whitespace-pre-line">
              <Render html={extractPlainText(post.content)} />
            </P>
          </div>

          <!-- 버튼 컨테이너 -->
          <div
            class="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-x-3 p-3"
          >
            <Button onclick={() => goto(`posts/${post.id}`)}>
              <EyeOutline />
            </Button>

            {#if userInfo?.id}
              <div class="flex gap-x-2">
                <Button color="green" onclick={() => handlePostModal(setModal, 'update', post)}>
                  <EditOutline />
                </Button>
                <form use:enhance={handleDelete} method="POST" action="?/delete">
                  <Input type="hidden" name="id" value={post.id} />
                  <Button color="red" type="submit"><TrashBinOutline /></Button>
                </form>
              </div>
            {/if}
          </div>
        </Card>
      {/each}
    </div>

    <!-- 페이지네이션 -->
    {#if data.postTotalCount > interval}
      <div class="mt-10 grid place-items-center">
        <div class="text-center">
          {#if data.postTotalCount > $currentTake}
            <Button class="w-full rounded-none" size="lg" color="dark" onclick={loadMoreData}
              >더 보기</Button
            >
          {/if}

          <div class="mt-2">
            {`${data.postTotalCount}개 목록 중 ${data.posts.length}개를 보셨습니다.`}
          </div>

          {#if data.postTotalCount <= $currentTake}
            <div class="mt-2">
              <button class="underline" onclick={async () => await goto('#')}>
                첫 번째 페이지로 이동
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    <Heading class="mb-2" tag="h5">{noDataMessage}</Heading>
  {/if}
</div>
