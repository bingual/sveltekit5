<script lang="ts">
  import { goto } from '$app/navigation';
  import MarkDownEditor from '$lib/components/MarkDownEditor.svelte';
  import { actionMap } from '$lib/utils/mapping';
  import { useContext } from '$lib/utils/stores';

  import type { ActionData } from './$types';

  const {
    toastStore: { addToast },
  } = useContext();

  let { form }: { form: ActionData } = $props();

  $effect(() => {
    if (form?.success && form.data) {
      const title = `'${form.data.title}'`;
      const action = actionMap(form.action).toastLabel;
      const toastMessage = `${title}을 ${action}하였습니다.`;
      addToast(toastMessage, form.action === 'delete' ? 'red' : 'green');

      goto(`/general/posts/${form.data.id}`);
    }
  });
</script>

<div class="@container">
  <MarkDownEditor />
</div>
