<script lang="ts">
  import type { ActionData, PageData, SubmitFunction } from './$types';
  import type { Memo } from '@prisma/client';
  import { useContext } from '$lib/utils/stores';
  import { Button, Card, Input } from 'svelte-5-ui-lib';
  import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { actionMap } from '$lib/utils/mapping';
  import { enhance } from '$app/forms';
  import { useLoadMore } from '$lib/utils/variables';

  const {
    modalStore: { setModal },
    toastStore: { addToast },
  } = useContext();

  const { currentTake, loadMoreData, unsubscribe } = useLoadMore();

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const handleModal = (action: ActionType, data?: Memo) => {
    const actionMap = {
      create: {
        modalTitle: '메모 생성',
        modalButtonLabels: { confirm: '생성', cancel: '취소' },
        props: { action },
      },
      update: {
        modalTitle: `'${data?.title}' 메모 수정`,
        modalButtonLabels: { confirm: '수정', cancel: '취소' },
        props: { data, action },
      },
    };

    const modalConfig = actionMap[action];

    setModal('SetMemo', modalConfig.modalTitle, modalConfig.modalButtonLabels, modalConfig.props);
  };

  const handleDelete: SubmitFunction = () => {
    return async ({ update }) => {
      const isConfirmed = confirm('정말로 삭제하시겠습니까?');
      if (isConfirmed) {
        await update();
      }
    };
  };

  $effect(() => {
    if (form?.success) {
      const title = `'${form.data.title}'`;
      const action = actionMap(form.action).toastMessage;
      const toastMessage = `${title}을 ${action}하였습니다.`;
      addToast(toastMessage);
    }

    return () => {
      unsubscribe();
    };
  });
</script>

<div class="mx-auto @container">
  <div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
    {#each data.memos as memo}
      <Card size="md" class="relative">
        <article class="prose pb-16 lg:prose-lg xl:prose-xl">
          <h3>{memo.title}</h3>
          <p>{memo.content}</p>
        </article>

        <div class="absolute bottom-3 left-3 flex gap-x-2 p-3">
          <Button onclick={() => handleModal('update', memo)}><EditOutline /></Button>
          <form use:enhance={handleDelete} method="POST" action="?/delete">
            <Input type="hidden" name="id" value={memo.id} />
            <Button type="submit"><TrashBinOutline /></Button>
          </form>
        </div>
      </Card>
    {/each}
  </div>

  <!-- TODO: 테스트용, 나중에 디자인 해야함 -->
  <div class="mt-3">
    <Button size="lg" onclick={() => handleModal('create')}>메모 생성</Button>

    {#if data.memoTotalCount > $currentTake}
      <Button class="mt-3 w-full" size="lg" onclick={loadMoreData}>더 보기</Button>
    {/if}
  </div>
</div>
