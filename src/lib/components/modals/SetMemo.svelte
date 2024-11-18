<script lang="ts">
  import type { SubmitFunction } from './$types';
  import { Modal, Button, Input, Textarea, Label } from 'svelte-5-ui-lib';
  import { useContext } from '$lib/utils/stores';
  import { actionMap } from '$lib/utils/mapping';
  import { enhance } from '$app/forms';
  import { isEmpty } from 'remeda';
  import Alert from '$lib/components/Alert.svelte';

  const {
    modalStore: { modalState },
  } = useContext();
  const { modalUi, modalProps, modalTitle, modalButtonLabels } = modalState();

  const closeModal = modalUi.close;
  let modalStatus = $state(false);
  let errors = $state<ValidationError[] | []>([]);

  const handleSubmit: SubmitFunction = () => {
    return async ({ result, update }) => {
      if (result.type === 'failure' && !result?.data?.status && !isEmpty(result?.data?.errors)) {
        errors = result.data.errors;
      } else {
        await update();
        closeModal();
      }
    };
  };

  $effect(() => {
    modalStatus = modalUi.isOpen;

    return () => {
      errors = [];
    };
  });
</script>

<Modal title={$modalTitle} {modalStatus} {closeModal} size="md" dismissable={true}>
  {#if !isEmpty(errors)}
    <Alert {errors} />
  {/if}

  <form
    use:enhance={handleSubmit}
    id="SetMemoForm"
    method="POST"
    action={`/memo?/${actionMap($modalProps?.action).actionType}`}
  >
    <Input type="hidden" name="id" value={$modalProps?.data?.id} />
    <article>
      <div>
        <Label class="mb-2 space-y-2" for="title"><span>제목</span></Label>
        <Input type="text" id="title" name="title" value={$modalProps?.data?.title} required />
      </div>

      <div class="mt-5">
        <Label class="my-2 space-y-2" for="content"><span>내용</span></Label>
        <Textarea
          class="mt-2 resize-none"
          id="content"
          name="content"
          value={$modalProps?.data?.content}
          rows={15}
          required
        />
      </div>
    </article>
  </form>
  {#snippet footer()}
    <Button type="submit" form="SetMemoForm" color="primary" class="me-2"
      >{$modalButtonLabels.confirm}</Button
    >
    <Button color="alternative" onclick={closeModal}>{$modalButtonLabels.cancel}</Button>
  {/snippet}
</Modal>
