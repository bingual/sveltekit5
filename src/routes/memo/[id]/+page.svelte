<script lang="ts">
  import { Render } from '@jill64/svelte-sanitize';
  import hljs from 'highlight.js';

  import type { ActionData, PageData } from './$types';

  let { data }: { data: PageData; form: ActionData } = $props();

  $effect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre code');
    blocks.forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  });
</script>

<div class="@container">
  <div class="prose prose-sm max-w-none dark:prose-invert xs:prose-base">
    <h1>{data.title}</h1>
    <Render html={data.content ?? ''} />
  </div>
</div>
