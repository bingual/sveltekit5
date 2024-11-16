import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();

  const memos = await prisma.memo.findMany({
    where: {
      author: session?.user?.id,
    },
  });

  return {
    memos,
  };
};

import type { Actions } from './$types';

export const actions = {
  default: async (event) => {},
} satisfies Actions;
