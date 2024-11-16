<script lang="ts">
  import { Modal, Button } from 'svelte-5-ui-lib';
  import { useContext } from '$lib/utils/stores';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

  const {
    modalStore: { modalState, setModal },
  } = useContext();
  const { modalUi } = modalState();
  const { modalTitle, modalButtonLabels } = setModal();

  let modalStatus = $state(false);
  const closeModal = modalUi.close;

  $effect(() => {
    modalStatus = modalUi.isOpen;
  });
</script>

<Modal title={$modalTitle} {modalStatus} {closeModal} size="sm" dismissable={true}>
  <div class="text-center">
    <ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
    <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">테스트 메모 모달</h3>
    <Button color="red" class="me-2" onclick={closeModal}>{$modalButtonLabels.confirm}</Button>
    <Button color="alternative" onclick={closeModal}>{$modalButtonLabels.cancel}</Button>
  </div>
</Modal>
