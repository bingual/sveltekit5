import { prisma } from '$lib/prisma';
import { postAction } from '$lib/server/action/handler.server';

import { redirect } from '@sveltejs/kit';

import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  const post = await prisma.post.findFirst({
    where: {
      id: id,
    },
    include: {
      user: true,
    },
  });

  if (post) {
    return {
      post,
    };
  } else {
    return redirect(302, '/general/posts');
  }
};

export const actions = {
  delete: async ({ locals, request }) => {
    return await postAction(locals, request, 'delete');
  },
} satisfies Actions;
