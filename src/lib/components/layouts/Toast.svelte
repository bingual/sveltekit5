<script lang="ts">
  import { useContext } from '$lib/utils/stores';

  import { CheckCircleSolid } from 'flowbite-svelte-icons';
  import { Toast } from 'svelte-5-ui-lib';

  const { toastStore } = useContext();
  const { toasts, removeToast } = toastStore;
</script>

<div class="fixed right-0 top-14 z-40 flex flex-col items-end space-y-4 p-4">
  {#if $toasts && $toasts.length > 0}
    {#each $toasts as toast (toast.id)}
      <Toast
        color={toast.color}
        class="rounded-lg border border-primary-600"
        dismissable={false}
        toastStatus={toast.status}
        onoutroend={() => removeToast(toast.id)}
      >
        {#snippet icon()}
          <CheckCircleSolid class="h-5 w-5" />
        {/snippet}
        {toast.message}
      </Toast>
    {/each}
  {/if}
</div>
