<script lang="ts">
  import { useContext } from '$lib/utils/stores';

  import type { YouTubeVideoInfo } from '@prisma/client';
  import clsx from 'clsx';
  import {
    A,
    Img,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'svelte-5-ui-lib';

  import type { PageData } from './$types';

  const {
    modalStore: { setModal },
  } = useContext();

  let { data }: { data: PageData } = $props();

  const handleModal = (videoData: YouTubeVideoInfo) => {
    const modalConfig = {
      modalTitle: data.melonChart?.title,
      modalButtonLabels: { confirm: '확인' },
      props: {
        data: videoData,
      },
    };

    setModal('SetVideo', modalConfig.modalTitle, modalConfig.modalButtonLabels, modalConfig.props);
  };
</script>

<div class="@container">
  <Table hoverable>
    {#snippet captionSlot()}
      <caption
        class="bg-white p-5 text-left text-lg font-semibold text-gray-900 dark:bg-gray-800 dark:text-white"
      >
        {data.melonChart?.title}
      </caption>
    {/snippet}
    <TableHead class="whitespace-nowrap">
      <TableHeadCell>순위</TableHeadCell>
      <TableHeadCell>썸네일</TableHeadCell>
      <TableHeadCell>제목</TableHeadCell>
      <TableHeadCell>게시자</TableHeadCell>
      <TableHeadCell>비디오 시간</TableHeadCell>
      <TableHeadCell>조회수</TableHeadCell>
    </TableHead>
    <TableBody class="divide-y text-xs xs:text-sm">
      {#if data.melonChart}
        {#each data.melonChart?.videoInfos as videoInfos, index}
          <TableBodyRow>
            <TableBodyCell>
              {index + 1}
            </TableBodyCell>
            <TableBodyCell>
              <Img
                imgClass={clsx('cursor-pointer')}
                size="xs"
                src={videoInfos.thumbUrl}
                alt={videoInfos.title}
                shadow="md"
                onclick={() => handleModal(videoInfos)}
              >
                {videoInfos.thumbUrl}
              </Img>
            </TableBodyCell>
            <TableBodyCell class="whitespace-pre-line">
              <A class="cursor-pointer" color="sky" onclick={() => handleModal(videoInfos)}>
                {videoInfos.title}
              </A>
            </TableBodyCell>
            <TableBodyCell>
              {videoInfos.author}
            </TableBodyCell>
            <TableBodyCell>
              {videoInfos.time}
            </TableBodyCell>
            <TableBodyCell>
              {videoInfos.views}
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      {/if}
    </TableBody>
  </Table>
</div>
