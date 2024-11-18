<script lang="ts">
  import { Button } from 'svelte-5-ui-lib';
  import { useContext } from '$lib/utils/stores';

  const { toastStore } = useContext();
  const { addToast } = toastStore;
</script>

<div class="mx-auto @container">
  <Button onclick={() => addToast('테스트 토스트 메세지')}>토스트 메세지 생성</Button>
</div>
