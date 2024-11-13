<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto">
  <article class="prose lg:prose-xl">
    <h1>SVELTEKIT TEST</h1>
    <ul>
      <li><a href="/demo/paraglide">Paraglide Demo</a></li>
      {#each data.users as user}
        <li>{user.email}</li>
      {/each}
    </ul>
  </article>
</div>
