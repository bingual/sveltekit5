<script lang="ts">
  import { InfoCircleSolid } from 'flowbite-svelte-icons';
  import { Alert } from 'svelte-5-ui-lib';

  const { errors }: { errors: ValidationError[] } = $props();
</script>

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
