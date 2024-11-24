<script lang="ts">
  import { Fileupload, Img } from 'svelte-5-ui-lib';
  let selectedFiles: FileList | undefined = $state();

  let filePreviews = $derived(
    selectedFiles
      ? Array.from(selectedFiles).map((file) => ({
          src: URL.createObjectURL(file),
          alt: file.name,
        }))
      : [],
  );

  $effect(() => {
    return () => {
      filePreviews.forEach(({ src }) => URL.revokeObjectURL(src));
    };
  });
</script>

<Fileupload clearable bind:files={selectedFiles} multiple />

<div class="mt-4">
  <div class="grid grid-cols-4 gap-4">
    {#each filePreviews as { src, alt }}
      <Img
        imgClass="h-32 w-32 object-cover"
        {src}
        {alt}
        caption={alt}
        alignment="center"
        shadow="md"
      />
    {/each}
  </div>
</div>
