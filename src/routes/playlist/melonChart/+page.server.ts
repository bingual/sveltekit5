import { prisma } from '$lib/prisma';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const findPlaylist = await prisma.youTubePlaylist.findFirst({
    orderBy: {
      created_at: 'desc',
    },
    include: {
      videoInfos: true,
    },
  });

  return {
    melonChart: findPlaylist,
  };
};
