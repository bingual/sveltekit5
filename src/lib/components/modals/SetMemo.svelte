<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Alert from '$lib/components/Alert.svelte';
  import MarkDownEditor from '$lib/components/MarkDownEditor.svelte';
  import SetImage from '$lib/components/modals/SetImage.svelte';
  import { actionMap } from '$lib/utils/mapping';
  import type { MemoWithImages } from '$lib/utils/prismaTypes';
  import { useContext } from '$lib/utils/stores';

  import type { SubmitFunction } from '@sveltejs/kit';
  import { ImageSolid } from 'flowbite-svelte-icons';
  import { forEach, isEmpty } from 'remeda';
  import { type Writable, writable } from 'svelte/store';
  import { Button, Input, Label, Modal, uiHelpers } from 'svelte-5-ui-lib';

  const {
    modalStore: { modalState },
    isLoading,
  } = useContext();
  const { modalUi, modalProps, modalTitle, modalButtonLabels } = modalState();
  const imageModalUi = uiHelpers();
  const closeModal = modalUi.close;

  let memoData: MemoWithImages | undefined = $derived($modalProps?.data);

  let modalStatus = $state(false);
  let formId = $state('SetMemoForm');
  let errors = $state<ValidationError[]>([]);

  let editorContent = writable('');
  let selectedFiles: Writable<FileList | undefined> = writable();
  let filePreviews: Writable<FilePreview[]> = writable([]);

  const handleSubmit: SubmitFunction = () => {
    isLoading.set(true);
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        const validRes = result.data as ValidationResponse;
        if (!validRes?.success && !isEmpty(validRes.errors)) {
          errors = validRes.errors;
          await goto('#alert');
        }
      } else {
        await update();
        closeModal();
      }
      isLoading.set(false);
    };
  };

  $effect(() => {
    modalStatus = modalUi.isOpen;

    if (!modalStatus) {
      selectedFiles.set(undefined);
    }

    return () => {
      errors = [];
      if (!isEmpty($filePreviews)) {
        forEach($filePreviews, (file) => URL.revokeObjectURL(file.src));
        $filePreviews = [];
      }
    };
  });
</script>

<!-- FIXME: 현재 svelte-5-ui-lib 베타버전 모달은 X축 반응형 동작에 버그있음. 모바일 환경에서 치명적임-->
<Modal title={$modalTitle} {modalStatus} {closeModal}>
  <div class="max-h-[70vh] overflow-hidden overflow-y-auto">
    {#if !isEmpty(errors)}
      <Alert {errors} />
    {/if}

    <form
      use:enhance={handleSubmit}
      id={formId}
      method="POST"
      action={`/memo?/${actionMap($modalProps?.action).actionType}`}
      enctype="multipart/form-data"
    >
      <input type="hidden" name="id" value={memoData?.id} />
      <input type="hidden" name="content" bind:value={$editorContent} />
      <input type="file" hidden={true} name="images" bind:files={$selectedFiles} multiple />
      <div>
        <div>
          <Label class="mb-2 space-y-2" for="title"><span>제목</span></Label>
          <Input type="text" id="title" name="title" value={memoData?.title} />
        </div>

        <div class="mt-5">
          <MarkDownEditor {memoData} {editorContent} {filePreviews} />
        </div>
      </div>
    </form>

    <div class="mt-5 flex items-center justify-between">
      <Button color="dark" onclick={imageModalUi.toggle}><ImageSolid /></Button>

      <div class="flex space-x-2">
        <Button type="submit" form={formId} color="primary">{$modalButtonLabels.confirm}</Button>
        <Button color="alternative" onclick={closeModal}>{$modalButtonLabels.cancel}</Button>
      </div>
    </div>
  </div>
</Modal>

{#if imageModalUi.isOpen}
  <SetImage {imageModalUi} {selectedFiles} {filePreviews} />
{/if}
