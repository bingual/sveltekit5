import { prisma } from '$lib/prisma';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const findPlaylist = await prisma.youTubePlaylist.findFirst({
    include: {
      videoInfos: true,
    },
  });

  return {
    melonChart: findPlaylist,
  };
};
