<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { actionMap } from '$lib/utils/mapping';
  import { useContext } from '$lib/utils/stores';

  import type { SubmitFunction } from '@sveltejs/kit';
  import { formatInTimeZone } from 'date-fns-tz';
  import hljs from 'highlight.js';
  import { isEmpty } from 'remeda';
  import { Banner, Button, Input } from 'svelte-5-ui-lib';

  import type { ActionData, PageData } from './$types';
  const {
    toastStore: { addToast },
    isLoading,
  } = useContext();

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const userInfo = $derived(page.data.session?.user);

  const handleDelete: SubmitFunction = ({ cancel }) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      isLoading.set(true);
      return async ({ result, update }) => {
        if (result.type === 'failure') {
          const validRes = result.data as ValidationResponse;
          if (!validRes?.success && !isEmpty(validRes.errors)) {
            addToast(validRes?.errors.join('\n'));
          }
        } else {
          await update();
        }
        isLoading.set(false);
      };
    } else {
      cancel();
    }
  };

  $effect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre code');
    blocks.forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  });

  $effect(() => {
    // TODO: 비공개 컬럼 적용할 때 작동할 예정
    if (form?.success && form.data) {
      const title = `'${form.data.title}'`;
      const action = actionMap(form.action).toastLabel;
      const toastMessage = `${title}을 ${action}하였습니다.`;
      addToast(toastMessage, form.action === 'delete' ? 'red' : 'green');
      goto('/general/posts');
    }
  });
</script>

<div class="@container">
  <div class="relative mb-3">
    <Banner id="info-banner" position="static" bannerType="info" dismissable={false}>
      {#snippet header()}
        <div class="mb-4 md:mb-0 md:me-4">
          <h2 class="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            {data.post.title}
          </h2>
          <p class="flex items-center text-sm font-normal text-gray-500 dark:text-gray-400">
            by {data.post.user.name ?? data.post.user.email} · {formatInTimeZone(
              data.post.createdAt,
              'Asia/Seoul',
              'yyyy-MM-dd',
            )}
          </p>
        </div>
      {/snippet}

      {#if userInfo?.id === data.post.user.id}
        <div class="flex gap-3">
          <Button
            type="button"
            color="green"
            size="sm"
            onclick={async () => await goto(`/manage/newPost/${data.post.id}`)}
          >
            수정
          </Button>

          <form use:enhance={handleDelete} method="POST" action="?/delete">
            <Input type="hidden" name="id" value={data.post.id} />
            <Button type="submit" color="rose" size="sm">삭제</Button>
          </form>
        </div>
      {/if}
    </Banner>
  </div>

  <div class="prose prose-sm max-w-none dark:prose-invert xs:prose-base">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html data.post.content}
  </div>
</div>
