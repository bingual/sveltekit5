import { prisma } from '$lib/prisma';
import { postAction } from '$lib/server/action/handler.server';

import { redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  const post = await prisma.post.findFirst({
    select: {
      id: true,
      title: true,
      content: true,
    },
    where: {
      id: id,
    },
  });

  if (post) {
    return {
      post,
    };
  } else {
    return redirect(302, '/manage');
  }
};

export const actions = {
  update: async ({ locals, request }) => {
    return await postAction(locals, request, 'update');
  },
} satisfies Actions;
