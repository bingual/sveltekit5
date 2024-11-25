<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { MemoWithImages } from '$lib/utils/prismaTypes';
  import { Modal, Button, Input, Textarea, Label, Img, uiHelpers } from 'svelte-5-ui-lib';
  import { ImageSolid } from 'flowbite-svelte-icons';
  import { useContext } from '$lib/utils/stores';
  import { actionMap } from '$lib/utils/mapping';
  import { enhance } from '$app/forms';
  import { isEmpty } from 'remeda';
  import Alert from '$lib/components/Alert.svelte';
  import SetImage from '$lib/components/modals/SetImage.svelte';
  import { type Writable, writable } from 'svelte/store';
  import clsx from 'clsx';
  import { getPublicUrl } from '$lib/utils/variables';

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

  let selectedFiles: Writable<FileList | undefined> = writable();
  let filePreviews: Writable<FilePreview[]> = writable([]);

  const handleSubmit: SubmitFunction = () => {
    isLoading.set(true);
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        const validRes = result.data as ValidationResponse;
        if (!validRes?.success && !isEmpty(validRes.errors)) {
          errors = validRes.errors;
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
        $filePreviews.forEach(({ src }) => URL.revokeObjectURL(src));
        $filePreviews = [];
      }
    };
  });
</script>

<!-- FIXME: 현재 svelte-5-ui-lib 베타버전 모달은 X축 반응형 동작에 버그있음. 모바일 환경에서 치명적임-->
<!-- TODO: MarkDown Editor 로 변경할 예정 -->
<Modal title={$modalTitle} {modalStatus} {closeModal}>
  <div class="overflow-x-auto">
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
      <input type="file" hidden={true} name="images" bind:files={$selectedFiles} multiple />
      <div>
        <div>
          <Label class="mb-2 space-y-2" for="title"><span>제목</span></Label>
          <Input type="text" id="title" name="title" value={memoData?.title} required />
        </div>

        <div class="mt-5">
          <Label class="my-2 space-y-2" for="content"><span>내용</span></Label>
          <Textarea
            class="mt-2 resize-none"
            id="content"
            name="content"
            rows={5}
            value={memoData?.content}
            required
          />
        </div>
      </div>
    </form>

    {#if memoData?.images[0]?.url}
      <Label class="mb-2 mt-5 space-y-2"><span class="text-green-700">등록된 이미지</span></Label>
      <div class="grid grid-cols-8 gap-4">
        {#each memoData.images as images, index}
          <Img
            imgClass="object-cover w-24 h-24"
            src={images.url.startsWith('https://') ? images.url : getPublicUrl(images.url)}
            alt={String(index)}
            shadow="md"
          />
        {/each}
      </div>
    {/if}

    {#if !isEmpty($filePreviews)}
      <Label class="mb-2 mt-5 space-y-2"
        ><span class={clsx(memoData ? 'text-red-700' : 'text-green-700')}
          >{actionMap($modalProps?.action).imageLabel}할 이미지</span
        ></Label
      >
      <div class="grid grid-cols-8 gap-4">
        {#each $filePreviews as { src, alt }}
          <Img imgClass="object-cover w-24 h-24" {src} {alt} shadow="md" />
        {/each}
      </div>
    {/if}

    <div class="mt-5 flex items-center justify-between">
      <Button color="dark" onclick={imageModalUi.toggle}><ImageSolid /></Button>

      <div class="flex space-x-2">
        <Button type="submit" form={formId} color="primary">{$modalButtonLabels.confirm}</Button>
        <Button color="alternative" onclick={closeModal}>{$modalButtonLabels.cancel}</Button>
      </div>
    </div>
  </div>
</Modal>

{#if modalStatus}
  <SetImage {imageModalUi} {selectedFiles} {filePreviews} />
{/if}
