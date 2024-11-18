<script lang="ts">
  import { Alert, Modal, Button, Input, Textarea, Label } from 'svelte-5-ui-lib';
  import { InfoCircleSolid } from 'flowbite-svelte-icons';
  import { useContext } from '$lib/utils/stores';
  import { actionMap } from '$lib/utils/mapping';
  import { enhance } from '$app/forms';
  import { isEmpty } from 'remeda';

  const {
    modalStore: { modalState, setModal },
  } = useContext();
  const { modalUi, modalProps } = modalState();
  const { modalTitle, modalButtonLabels } = setModal();

  const closeModal = modalUi.close;
  let modalStatus = $state(false);
  let errors = $state<ValidationError[] | []>([]);

  const handleSubmit = () => {
    return async ({ result, update }) => {
      if (result?.data.error) {
        errors = result.data.errors;
      } else {
        update();
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
    <div class="mb-4">
      <Alert color="red" class="!items-start">
        {#snippet icon()}
          <InfoCircleSolid class="h-5 w-5" />
        {/snippet}
        <p class="font-medium">다음 요구 사항이 충족되는지 확인하세요.</p>
        <ul class="ms-4 mt-1.5 list-inside list-disc">
          {#each errors as error}
            <li>{error.message}</li>
          {/each}
        </ul>
      </Alert>
    </div>
  {/if}

  <form
    use:enhance={handleSubmit}
    method="POST"
    action={`/memo?/${actionMap($modalProps?.action).actionType}`}
  >
    <Input type="hidden" name="id" value={$modalProps?.data?.id} />
    <article>
      <div>
        <Label class="mb-2 space-y-2"><span>제목</span></Label>
        <Input type="text" name="title" value={$modalProps?.data?.title} required />
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
