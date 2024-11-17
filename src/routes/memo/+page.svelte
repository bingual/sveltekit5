<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { useContext } from '$lib/utils/stores';
  import { Button, Card, Input } from 'svelte-5-ui-lib';
  import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { actionMap } from '$lib/utils/mapping';

  const {
    modalStore,
    toastStore: { addToast },
  } = useContext();
  const { setModal } = modalStore;
  const { activeModal } = setModal();

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const handleModal = (action: ActionType, data?: any) => {
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

    activeModal(
      'SetMemo',
      modalConfig.modalTitle,
      modalConfig.modalButtonLabels,
      modalConfig.props,
    );
  };

  $effect(() => {
    if (form?.success) {
      const title = `'${form.result.data.title}'`;
      const action = actionMap(form.action).toastMessage;
      const toastMessage = `${title}을 ${action}하였습니다.`;
      addToast(toastMessage);
    }
  });

  const handleDelete = (event: SubmitEvent) => {
    event.preventDefault();

    const isConfirmed = confirm('정말로 삭제하시겠습니까?');
    if (isConfirmed) {
      (event.target as HTMLFormElement).submit();
    }
  };
</script>

<div class="container mx-auto">
  <div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
    {#each data.memos as memo}
      <Card size="md">
        <article class="prose lg:prose-lg xl:prose-xl">
          <h3>{memo.title}</h3>
          <p>{memo.content}</p>
        </article>
        <div class="mt-5 flex gap-x-2">
          <Button onclick={() => handleModal('update', memo)}><EditOutline /></Button>
          <form onsubmit={handleDelete} method="POST" action="?/delete">
            <Input type="hidden" name="id" value={memo.id} />
            <Button type="submit"><TrashBinOutline /></Button>
          </form>
        </div>
      </Card>
    {/each}
  </div>

  <!-- test create button -->
  <div class="mt-3">
    <Button size="lg" onclick={() => handleModal('create')}>메모 생성</Button>
  </div>
</div>
