import { ROOT_USER } from '$env/static/private';
import { prisma } from '$lib/prisma';
import { PostWithImages } from '$lib/utils/prismaTypes';
import { sanitizeContents } from '$lib/utils/variables.server';

import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent, url }) => {
  const { session } = await parent();

  const searchParams = url.searchParams;

  const category = searchParams.get('category') ?? 'all';
  const query = searchParams.get('query') ?? '';
  const take = Number(searchParams.get('take')) || 20;

  const rootUser = await prisma.user.findFirst({
    select: { id: true },
    where: {
      email: ROOT_USER,
    },
  });

  const [posts, postTotalCount] = await Promise.all([
    prisma.post.findMany({
      where: {
        author: session?.user?.id ?? rootUser?.id,
        ...(query &&
          category === 'all' && {
            OR: [{ title: { contains: query } }, { content: { contains: query } }],
          }),
        ...(category !== 'all' && query && { [category]: { contains: query } }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
      include: {
        images: {
          select: { url: true },
        },
      },
    }),
    prisma.post.count({
      where: {
        author: session?.user?.id ?? rootUser?.id,
        ...(query &&
          category === 'all' && {
            OR: [{ title: { contains: query } }, { content: { contains: query } }],
          }),
        ...(category !== 'all' && query && { [category]: { contains: query } }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const sanitizePosts = sanitizeContents(posts) as PostWithImages[];

  return {
    posts: sanitizePosts,
    postTotalCount,
  };
};
