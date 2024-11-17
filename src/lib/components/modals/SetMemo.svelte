<script lang="ts">
  import { Modal, Button, Input, Textarea, Label } from 'svelte-5-ui-lib';
  import { useContext } from '$lib/utils/stores';
  import { actionMap } from '$lib/utils/mapping';

  const {
    modalStore: { modalState, setModal },
  } = useContext();
  const { modalUi, modalProps } = modalState();
  const { modalTitle, modalButtonLabels } = setModal();

  const closeModal = modalUi.close;
  let modalStatus = $state(false);

  $effect(() => {
    modalStatus = modalUi.isOpen;
  });
</script>

<!-- TODO: 유효성 검사 피드백 기능 구현 -->
<Modal title={$modalTitle} {modalStatus} {closeModal} size="md" dismissable={true}>
  <form method="POST" action={`/memo?/${actionMap($modalProps?.action).actionType}`}>
    <Input type="hidden" name="id" value={$modalProps?.data?.id} />

    <article>
      <div>
        <Label class="mb-2 space-y-2"><span>제목</span></Label>
        <Input type="text" name="title" value={$modalProps?.data?.title} />
      </div>

      <div class="mt-5">
        <Label class="my-2 space-y-2"><span>내용</span></Label>
        <Textarea
          class="mt-2 resize-none"
          name="content"
          value={$modalProps?.data?.content}
          rows={15}
          required
        />
      </div>
    </article>

    <article class="mt-2">
      <Button type="submit" color="primary" class="me-2">{$modalButtonLabels.confirm}</Button>
      <Button color="alternative" onclick={closeModal}>{$modalButtonLabels.cancel}</Button>
    </article>
  </form>
</Modal>
