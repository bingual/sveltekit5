<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { actionMap } from '$lib/utils/mapping';
  import { useContext } from '$lib/utils/stores';
  import { getPublicUrl } from '$lib/utils/variables';
  import { generateNoDataMessage, useLoadMore } from '$lib/utils/variables.svelte';

  import type { Memo } from '@prisma/client';
  import { EditOutline, PenNibOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { isEmpty } from 'remeda';
  import { Button, Card, Heading, Input } from 'svelte-5-ui-lib';

  import type { ActionData, PageData, SubmitFunction } from './$types';

  const {
    modalStore: { setModal },
    toastStore: { addToast },
    isLoading,
  } = useContext();

  const { interval, currentTake, loadMoreData } = useLoadMore();

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isMemos = $state(false);
  let noDataMessage = $state();

  const items = [
    {
      name: '제목',
      value: 'title',
    },
    { name: '내용', value: 'content' },
  ];

  const handleModal = (action: ActionType, memoData?: Memo) => {
    const actionMap = {
      create: {
        modalTitle: '메모 생성',
        modalButtonLabels: { confirm: '생성', cancel: '취소' },
        props: { action },
      },
      update: {
        modalTitle: `메모 수정`,
        modalButtonLabels: { confirm: '수정', cancel: '취소' },
        props: { data: memoData, action },
      },
    };

    const modalConfig = actionMap[action];

    setModal('SetMemo', modalConfig.modalTitle, modalConfig.modalButtonLabels, modalConfig.props);
  };

  const handleDelete: SubmitFunction = ({ cancel }) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      isLoading.set(true);
      return async ({ update }) => {
        await update();
        isLoading.set(false);
      };
    } else {
      cancel();
    }
  };

  $effect(() => {
    if (form?.success) {
      const title = `'${form.data?.title}'`;
      const action = actionMap(form.action).toastLabel;
      const toastMessage = `${title}을 ${action}하였습니다.`;
      addToast(toastMessage);
    }

    isMemos = isEmpty(data.memos);
    noDataMessage = generateNoDataMessage();
  });
</script>

<div class="mx-auto min-h-screen @container">
  <SearchBar {items} />

  {#if !isMemos}
    <!-- 그리드 -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {#each data.memos as memo}
        <Card
          class="relative"
          size="md"
          img={memo?.images[0]?.url
            ? {
                src: memo.images[0].url.startsWith('https://')
                  ? memo.images[0].url
                  : getPublicUrl(memo.images[0].url),
                alt: memo.title,
              }
            : {
                src: '/images/noImage.jpg',
                alt: memo.title,
              }}
        >
          <div class="prose pb-16 lg:prose-lg xl:prose-xl">
            <h3 class="line-clamp-2">{memo.title}</h3>
            <!-- TODO: 나중에 내용 적당히 자를 수 있는 방법 적용해야함 -->
            <!--            <p class="line-clamp-4"><Render html={memo.content} /></p>-->
          </div>

          <div class="absolute bottom-3 left-3 flex gap-x-2 p-3">
            <Button color="green" onclick={() => handleModal('update', memo)}
              ><EditOutline /></Button
            >
            <form use:enhance={handleDelete} method="POST" action="?/delete">
              <Input type="hidden" name="id" value={memo.id} />
              <Button color="red" type="submit"><TrashBinOutline /></Button>
            </form>
          </div>
        </Card>
      {/each}
    </div>

    <!-- 페이지네이션 -->
    {#if data.memoTotalCount > interval}
      <div class="mt-10 grid place-items-center">
        <div class="text-center">
          {#if data.memoTotalCount > currentTake}
            <Button class="w-full rounded-none" size="lg" color="dark" onclick={loadMoreData}
              >더 보기</Button
            >
          {/if}

          <div class="mt-2">
            {`${data.memoTotalCount}개 목록 중 ${data.memos.length}개를 보셨습니다.`}
          </div>

          {#if data.memoTotalCount <= currentTake}
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

  <!-- 플로팅 -->
  <div class="fixed bottom-48 right-0 z-40 xs:bottom-12 xs:right-5">
    <Button size="sm" shadow onclick={() => handleModal('create')}>
      <PenNibOutline size="xl" />
    </Button>
  </div>
</div>
