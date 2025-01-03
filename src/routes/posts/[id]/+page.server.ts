import { prisma } from '$lib/prisma';
import { sanitizeContents } from '$lib/utils/variables.server';

import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

  const post = await prisma.post.findFirst({
    select: {
      title: true,
      content: true,
    },
    where: {
      id: id,
    },
  });

  if (!post) {
    return redirect(302, '/post');
  }

  if (post) {
    const sanitizePost = sanitizeContents(post.content) as string;
    return {
      title: post.title,
      content: sanitizePost,
    };
  }
};
