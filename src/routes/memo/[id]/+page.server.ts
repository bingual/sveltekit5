import { prisma } from '$lib/prisma';
import { sanitizeContents } from '$lib/utils/variables.server';

import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  const memo = await prisma.memo.findFirst({
    select: {
      title: true,
      content: true,
    },
    where: {
      id: id,
    },
  });

  if (!memo) {
    return redirect(302, '/memo');
  }

  if (memo) {
    const sanitizeMemo = sanitizeContents(memo.content) as string;
    return {
      title: memo.title,
      content: sanitizeMemo,
    };
  }
};
