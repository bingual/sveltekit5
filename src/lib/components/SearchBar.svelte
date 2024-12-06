<script lang="ts">
  import clsx from 'clsx';
  import { SearchOutline } from 'flowbite-svelte-icons';
  import { Button, ButtonGroup, Search, Select } from 'svelte-5-ui-lib';

  const { items: originItems }: { items: { name: string; value: string }[] } = $props();
  const items = [{ name: '전체', value: 'all' }, ...originItems];

  let selectCategory = $state('all');
</script>

<div class="mb-4">
  <form method="GET">
    <ButtonGroup>
      <Select
        class="w-1/2 rounded-e-none"
        {items}
        name="category"
        bind:value={selectCategory}
        placeholder="...선택"
      />
      <Search
        inputClass={clsx('rounded-none')}
        name="query"
        placeholder="...검색"
        required={false}
      />
      <Button class="rounded-s-none" type="submit" color="primary">
        <SearchOutline class="h-6 w-6" />
      </Button>
    </ButtonGroup>
  </form>
</div>
