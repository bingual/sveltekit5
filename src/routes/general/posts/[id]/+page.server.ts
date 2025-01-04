import { prisma } from '$lib/prisma';
import { postAction } from '$lib/server/action/handler.server';
import { sanitizeContents } from '$lib/utils/variables.server';

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

  if (!post) {
    return redirect(302, '/general/posts');
  }

  if (post) {
    const sanitizePost = sanitizeContents(post.content) as string;
    return {
      post: {
        id: post.id,
        title: post.title,
        content: sanitizePost,
        createdAt: post.createdAt,
        user: post.user,
      },
    };
  }
};

export const actions = {
  delete: async ({ locals, request }) => {
    return await postAction(locals, request, 'delete');
  },
} satisfies Actions;
