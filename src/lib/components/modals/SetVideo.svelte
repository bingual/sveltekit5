<script lang="ts">
  import { useContext } from '$lib/utils/stores';

  import type { YouTubeVideoInfo } from '@prisma/client';
  import { Modal } from 'svelte-5-ui-lib';

  const {
    modalStore: { modalState },
  } = useContext();
  const { modalUi, modalProps, modalTitle } = modalState();
  const closeModal = modalUi.close;

  let modalStatus = $state(false);

  let videoData: YouTubeVideoInfo = $derived($modalProps?.data);

  $effect(() => {
    modalStatus = modalUi.isOpen;
  });
</script>

<Modal title={$modalTitle} {modalStatus} {closeModal}>
  <iframe
    class="h-96 w-full"
    src={`${videoData.shareUrl}?autoplay=1&mute=0&vq=hd1080&controls=1&rel=0`}
    title="YouTube video player"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</Modal>
