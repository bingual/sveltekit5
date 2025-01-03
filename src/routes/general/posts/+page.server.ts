import { ROOT_USER } from '$env/static/private';
import { prisma } from '$lib/prisma';
import { PostWithImages } from '$lib/utils/prismaTypes';
import { sanitizeContents, storageManager } from '$lib/utils/variables.server';

import { fail, redirect } from '@sveltejs/kit';
import { difference, filter, isEmpty, map } from 'remeda';

import type { Actions, PageServerLoad } from './$types';
import { formDataSchema } from './schema';

const {
  getPublicUrls,
  getOriginUrls,
  removePublicStorageFile,
  uploadPublicStorage,
  replaceBlobImageSrc,
  extractImgSrc,
} = storageManager();

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

export const actions = {
  create: async ({ locals, request }) => {
    return await handleAction(locals, request, 'create');
  },
  update: async ({ locals, request }) => {
    return await handleAction(locals, request, 'update');
  },
  delete: async ({ locals, request }) => {
    return await handleAction(locals, request, 'delete');
  },
} satisfies Actions;

const handleAction = async (locals: App.Locals, request: Request, actionType: ActionType) => {
  try {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/post');
    }

    const formData = await request.formData();
    const fromEntries = Object.fromEntries(formData);
    const imageFiles = formData.getAll('images') as File[];

    if (actionType === 'delete') {
      const formValidation = formDataSchema.pick({ id: true }).safeParse(fromEntries);
      if (formValidation.success) {
        const postImages = await prisma.postImage.findMany({
          select: {
            url: true,
          },
          where: {
            postId: formValidation.data?.id,
            post: {
              author: session?.user?.id,
            },
          },
        });

        const urlsToDelete = map(postImages, (image) => image.url);
        if (!isEmpty(urlsToDelete)) {
          await removePublicStorageFile(urlsToDelete);
        }

        const deletedPost = await prisma.post.delete({
          where: {
            author: session?.user?.id,
            id: formValidation.data?.id,
          },
        });

        if (deletedPost.id) {
          return {
            success: true,
            action: 'delete' as ActionType,
            data: deletedPost,
          };
        }
      } else {
        const errors = map(formValidation.error?.errors, (err) => ({
          field: err.path[0],
          message: err.message,
        }));
        return fail(400, { success: false, errors });
      }
    } else {
      const formValidation = formDataSchema.safeParse(fromEntries);

      if (formValidation.success) {
        const { id, title, content } = formValidation.data;

        const validImageFiles = filter(imageFiles, (file) => file.size > 0 && file.name !== '');
        const uploadResults = !isEmpty(validImageFiles)
          ? await Promise.all(map(imageFiles, (file) => uploadPublicStorage(file, 'posts/images/')))
          : [];

        const replaceContented = replaceBlobImageSrc(content, getPublicUrls(uploadResults));
        const sanitizedPosts = sanitizeContents(replaceContented) as string;

        if (actionType === 'create') {
          const createdPost = await prisma.post.create({
            data: {
              author: session?.user?.id,
              title: title,
              content: sanitizedPosts,
              images: {
                create: map(uploadResults, (url) => ({
                  url,
                })),
              },
            },
          });

          if (createdPost.id) {
            return {
              success: true,
              action: 'create' as ActionType,
              data: createdPost,
            };
          }
        } else if (actionType === 'update') {
          // TODO: 매번 수정시 마다 삭제하는거보다는 CronJob으로 정기적으로 불필요한것들 삭제하는게 효율적이니 나중에 수정
          const postImages = await prisma.postImage.findMany({
            select: {
              url: true,
            },
            where: {
              postId: formValidation.data?.id,
              post: {
                author: session?.user?.id,
              },
            },
          });

          const postImageUrls = map(postImages, (image) => image.url);
          const extractedImgSrc = getOriginUrls(extractImgSrc(sanitizedPosts));

          const diffExtracted = difference(postImageUrls, extractedImgSrc);

          const urlsToDelete = map(diffExtracted, (imageUrl) => imageUrl);
          if (!isEmpty(urlsToDelete)) {
            await removePublicStorageFile(urlsToDelete);
          }

          const [updatedPost] = await prisma.$transaction(async (prisma) => {
            const updatedPost = await prisma.post.update({
              data: {
                author: session?.user?.id,
                title: title,
                content: sanitizedPosts,
              },
              where: {
                author: session?.user?.id,
                id: id,
              },
            });

            const deletedImagesCount = await prisma.postImage.deleteMany({
              where: {
                postId: formValidation.data?.id,
                url: { in: diffExtracted },
              },
            });

            const createdPostImagesCount =
              !isEmpty(uploadResults) &&
              (await prisma.postImage.createMany({
                data: map(uploadResults, (url) => ({
                  url,
                  postId: id!,
                })),
              }));

            return [updatedPost, deletedImagesCount, createdPostImagesCount];
          });

          if (updatedPost.id) {
            return {
              success: true,
              action: 'update' as ActionType,
              data: updatedPost,
            };
          }
        }
      } else {
        const errors = formValidation.error?.errors
          ? map(formValidation.error.errors, (err) => ({
              field: err.path[0],
              message: err.message,
            }))
          : [];

        return fail(400, { success: false, errors });
      }
    }
  } catch (err) {
    console.error(err);
  }
};
