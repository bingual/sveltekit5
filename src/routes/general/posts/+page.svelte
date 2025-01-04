<script lang="ts">
  import { goto } from '$app/navigation';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import type { PostWithImages } from '$lib/utils/prismaTypes';
  import { getPublicUrl } from '$lib/utils/variables';
  import { generateNoDataMessage, useLoadMore } from '$lib/utils/variables.svelte.js';

  import { formatInTimeZone } from 'date-fns-tz';
  import { isEmpty } from 'remeda';
  import { Button, Card, Heading, P } from 'svelte-5-ui-lib';

  import type { ActionData, PageData } from './$types';

  const { interval, currentTake, loadMoreData, resetTake } = useLoadMore();

  let { data }: { data: PageData; form: ActionData } = $props();

  const isPosts = $derived(isEmpty(data.posts));
  const noDataMessage = $derived(generateNoDataMessage());

  const items = [
    {
      name: '제목',
      value: 'title',
    },
    { name: '내용', value: 'content' },
  ];

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
</script>

<div class="min-h-screen @container">
  <SearchBar {items} />

  {#if !isPosts}
    <!-- 그리드 -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {#each data.posts as post}
        <Card
          href={`posts/${post.id}`}
          class="relative"
          size="md"
          img={{
            src: extractThumbnail(post),
            alt: post.title || 'Default Title',
          }}
        >
          <div>
            <Heading class="mb-5 line-clamp-2 whitespace-pre-line" tag="h3">{post.title}</Heading>

            <P class="line-clamp-4 whitespace-pre-line">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html extractPlainText(post.content)}
            </P>

            <P class="mt-5">{formatInTimeZone(post.createdAt, 'Asia/Seoul', 'yyyy-MM-dd')}</P>
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
