<script lang="ts">
  import Alert from '$lib/components/Alert.svelte';
  import { actionMap } from '$lib/utils/mapping';
  import { imageFilesSchema } from '$lib/utils/schema';
  import { useContext } from '$lib/utils/stores';

  import clsx from 'clsx';
  import { isEmpty, map } from 'remeda';
  import type { Writable } from 'svelte/store';
  import { Button, Fileupload, Helper, Img, Modal, uiHelpers } from 'svelte-5-ui-lib';

  const {
    modalStore: { modalState },
    toastStore: { addToast },
  } = useContext();

  const { modalProps } = modalState();

  const {
    imageModalUi,
    selectedFiles: parentSelectedFiles,
    filePreviews: parentFilePreviews,
  }: {
    imageModalUi: ReturnType<typeof uiHelpers>;
    selectedFiles: Writable<FileList | undefined>;
    filePreviews: Writable<FilePreview[]>;
  } = $props();

  const closeModal = imageModalUi.close;

  let modalStatus = $state(false);
  let errors = $state<ValidationError[]>([]);

  let title = $state('이미지 업로드');
  let formId = $state('SetImageForm');
  let accept = $state('.jpg, .jpeg, .png');

  let selectedFiles = $state<FileList | undefined>();
  let filePreviews: FilePreview[] = $state([]);
  let isValid = $state(true);
  let helperMessage = $state('지원 확장자: jpg, jpeg, png / 최대 크기: 50MB');

  const handleConfirm = () => {
    if (!selectedFiles) {
      errors = [{ field: 'images', message: '파일을 최소 1개 업로드해야 합니다.' }];
      return;
    }

    if (isValid) {
      parentSelectedFiles.set(selectedFiles);
      parentFilePreviews.set(filePreviews);

      if (selectedFiles) {
        addToast('임시 이미지를 등록하였습니다.', 'green');
      }
      closeModal();
    }
  };

  $effect(() => {
    if (selectedFiles) {
      const imageValidation = imageFilesSchema.safeParse(Array.from(selectedFiles));

      if (imageValidation.success) {
        isValid = true;
        filePreviews = selectedFiles
          ? map(Array.from(selectedFiles), (file) => ({
              src: URL.createObjectURL(file),
              alt: file.name,
            }))
          : [];
      } else {
        isValid = false;
        errors = imageValidation.error?.errors
          ? map(imageValidation.error.errors, (err) => ({
              field: err.path[0],
              message: err.message,
            }))
          : [];
      }
    }
  });

  $effect(() => {
    modalStatus = imageModalUi.isOpen;
  });
</script>

<Modal
  {title}
  {modalStatus}
  {closeModal}
  size="sm"
  position="top-center"
  dismissable={false}
  outsideClose={false}
>
  {#if !isEmpty(errors)}
    <Alert {errors} />
  {/if}

  <Fileupload name="images" bind:files={selectedFiles} clearable multiple required {accept} />
  <Helper>{helperMessage}</Helper>

  {#if !isEmpty(filePreviews)}
    <div class="mt-4 grid grid-cols-4 gap-4">
      {#each filePreviews as { src, alt }}
        <Img
          imgClass={clsx('w-24 h-24 object-cover')}
          captionClass={clsx('line-clamp-2')}
          {src}
          {alt}
          caption={alt}
          alignment="center"
          shadow="md"
        />
      {/each}
    </div>
  {/if}

  {#snippet footer()}
    <Button
      form={formId}
      color="primary"
      onclick={() => {
        handleConfirm();
      }}>{actionMap($modalProps?.action).imageLabel}</Button
    >
    <Button
      color="gray"
      onclick={() => {
        closeModal();
      }}>취소</Button
    >
  {/snippet}
</Modal>
