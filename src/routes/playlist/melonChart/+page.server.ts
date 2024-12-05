import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

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
