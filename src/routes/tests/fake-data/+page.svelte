<script lang="ts">
  import type { ActionData, SubmitFunction } from './$types';
  import { Card, Label, Input, Button } from 'svelte-5-ui-lib';
  import { actionMap } from '$lib/utils/mapping';
  import { useContext } from '$lib/utils/stores';
  import { enhance } from '$app/forms';

  const {
    toastStore: { addToast },
  } = useContext();

  let { form }: { form: ActionData } = $props();
  let initCount = $state(1);

  const handleSubmit: SubmitFunction = () => {
    return async ({ update }) => {
      await update();
      initCount = 1;
    };
  };

  $effect(() => {
    if (form?.success) {
      const count = `'${form.data.count}'`;
      const action = actionMap(form.action).toastMessage;
      const toastMessage = `메모를 ${count}개 ${action}하였습니다.`;
      addToast(toastMessage);
    }
  });
</script>

<div class="mx-auto @container">
  <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
    <Card size="sm">
      <div class="prose lg:prose-lg xl:prose-xl">
        <h3>메모 데이터 생성</h3>
        <form use:enhance={handleSubmit} method="POST" action="?/memoCreate">
          <div>
            <Label class="prose my-2 space-y-2 lg:prose-lg xl:prose-xl" for="count"
              ><span>생성할 개수</span></Label
            >
            <Input type="number" id="count" name="count" min={1} max={99} bind:value={initCount} />
          </div>

          <div class="mt-3">
            <Button color="green" type="submit">생성</Button>
            <Button color="red" type="submit" formaction="?/memoDelete">전체 삭제</Button>
          </div>
        </form>
      </div>
    </Card>
  </div>
</div>
