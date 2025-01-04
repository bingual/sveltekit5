<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Alert from '$lib/components/Alert.svelte';
  import SetImage from '$lib/components/modals/SetImage.svelte';
  import { actionMap } from '$lib/utils/mapping';
  import type { PostWithImages } from '$lib/utils/prismaTypes';
  import { useContext } from '$lib/utils/stores';

  import type { SubmitFunction } from '@sveltejs/kit';
  import { ImageSolid } from 'flowbite-svelte-icons';
  import { forEach, isEmpty } from 'remeda';
  import { writable } from 'svelte/store';
  import { Button, Input, Modal, uiHelpers } from 'svelte-5-ui-lib';

  const {
    modalStore: { modalState },
    isLoading,
  } = useContext();
  const { modalUi, modalProps, modalTitle, modalButtonLabels } = modalState();
  const imageModalUi = uiHelpers();
  const closeModal = modalUi.close;

  let postData: PostWithImages | undefined = $derived($modalProps?.data);

  let modalStatus = $state(false);
  let formId = $state('SetPostForm');
  let errors = $state<ValidationError[]>([]);

  let editorContent = writable<string | undefined>('');
  let selectedFiles = writable<FileList | undefined>();
  let filePreviews = writable<FilePreview[]>([]);

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

<Modal
  title={$modalTitle}
  {modalStatus}
  {closeModal}
  size="xl"
  dismissable={false}
  outsideClose={false}
>
  <div class="max-h-[70vh] overflow-hidden overflow-y-auto">
    {#if !isEmpty(errors)}
      <Alert {errors} />
    {/if}

    <form
      use:enhance={handleSubmit}
      id={formId}
      method="POST"
      action={`${page.url.pathname}?/${actionMap($modalProps?.action).actionType}`}
      enctype="multipart/form-data"
    >
      <input type="hidden" name="id" value={postData?.id} />
      <input type="hidden" name="content" bind:value={$editorContent} />
      <input type="file" hidden={true} name="images" bind:files={$selectedFiles} multiple />
      <div>
        <div>
          <Input
            class="bg-white text-base dark:bg-gray-900 dark:text-[#D1D5DB]"
            type="text"
            id="title"
            name="title"
            value={postData?.title}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div class="mt-5"></div>
      </div>
    </form>
  </div>

  {#snippet footer()}
    <div class="flex w-full justify-between">
      <Button color="rose" onclick={imageModalUi.toggle}><ImageSolid /></Button>

      <div class="flex space-x-2">
        <Button type="submit" form={formId} color="primary">{$modalButtonLabels.confirm}</Button>
        <Button color="gray" onclick={closeModal}>{$modalButtonLabels.cancel}</Button>
      </div>
    </div>
  {/snippet}
</Modal>

{#if imageModalUi.isOpen}
  <SetImage {imageModalUi} {selectedFiles} {filePreviews} />
{/if}
