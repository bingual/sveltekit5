import { prisma } from '$lib/prisma';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const findPlaylist = await prisma.youTubePlaylist.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      videoInfos: true,
    },
  });

  return {
    melonChart: findPlaylist,
  };
};
