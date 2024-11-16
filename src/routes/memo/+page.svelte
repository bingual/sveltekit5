<script lang="ts">
  import type { PageData } from './$types';
  import { Button } from 'svelte-5-ui-lib';
  import { useContext } from '$lib/utils/stores';

  const { modalStore } = useContext();
  const { setModal } = modalStore;
  const { activeModal } = setModal();

  let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto">
  <Button
    onclick={() => {
      activeModal('SetMemo', '메모');
    }}>SetMemo</Button
  >
</div>
