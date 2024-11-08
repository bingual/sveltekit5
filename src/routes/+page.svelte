<script lang="ts">
  import { SignIn } from '@auth/sveltekit/components';
</script>

<div class="container mx-auto">
  <article class="prose lg:prose-xl">
    <h1>SVELTEKIT TEST</h1>
    <ul>
      <li><a href="/demo/paraglide">Paraglide Demo</a></li>
    </ul>
  </article>

  <SignIn provider="github" signInPage="signin" />
</div>
