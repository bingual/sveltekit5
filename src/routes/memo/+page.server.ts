import { prisma } from '$lib/prisma';
import { storageManager } from '$lib/utils/variables.server';

import { fail, redirect } from '@sveltejs/kit';
import { filter, isEmpty, map } from 'remeda';

import type { Actions, PageServerLoad } from './$types';
import { formDataSchema } from './schema';

const { removePublicStorageFile, uploadPublicStorage } = storageManager();

export const load: PageServerLoad = async ({ parent, url }) => {
  const { session } = await parent();

  const searchParams = url.searchParams;
  const take = Number(searchParams.get('take')) || 20;
  const category = searchParams.get('category') || 'all';
  const query = searchParams.get('query') || '';

  const [memos, memoTotalCount] = await Promise.all([
    prisma.memo.findMany({
      where: {
        author: session?.user?.id,
        ...(query &&
          category === 'all' && {
            OR: [{ title: { contains: query } }, { content: { contains: query } }],
          }),
        ...(category !== 'all' && query && { [category]: { contains: query } }),
      },
      orderBy: {
        created_at: 'desc',
      },
      take,
      include: {
        images: {
          select: { url: true },
        },
      },
    }),
    prisma.memo.count({
      where: {
        author: session?.user?.id,
      },
    }),
  ]);

  return {
    memos,
    memoTotalCount,
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
      return redirect(302, '/');
    }

    const formData = await request.formData();
    const fromEntries = Object.fromEntries(formData);
    const imageFiles = formData.getAll('images') as File[];

    if (actionType === 'delete') {
      const formValidation = formDataSchema.pick({ id: true }).safeParse(fromEntries);
      if (formValidation.success) {
        const memoImages = await prisma.memoImage.findMany({
          where: {
            memoId: formValidation.data?.id,
            Memo: {
              author: session?.user?.id,
            },
          },
        });

        const urlsToDelete = map(memoImages, (image) => image.url);
        if (!isEmpty(urlsToDelete)) {
          await removePublicStorageFile(urlsToDelete);
        }

        const deletedMemo = await prisma.memo.delete({
          where: {
            author: session?.user?.id,
            id: formValidation.data?.id,
          },
        });

        if (deletedMemo.id) {
          return {
            success: true,
            action: 'delete' as ActionType,
            data: deletedMemo,
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
          ? await Promise.all(map(imageFiles, (file) => uploadPublicStorage(file, '/images/memo')))
          : [];

        if (actionType === 'create') {
          const createdMemo = await prisma.memo.create({
            data: {
              author: session?.user?.id,
              title: title,
              content: content,
              images: {
                create: map(uploadResults, (url) => ({
                  url,
                })),
              },
            },
          });

          if (createdMemo.id) {
            return {
              success: true,
              action: 'create' as ActionType,
              data: createdMemo,
            };
          }
        } else if (actionType === 'update') {
          const memoImages = await prisma.memoImage.findMany({
            where: {
              memoId: formValidation.data?.id,
              Memo: {
                author: session?.user?.id,
              },
            },
          });

          const urlsToDelete = map(memoImages, (image) => image.url);
          if (!isEmpty(urlsToDelete)) {
            await removePublicStorageFile(urlsToDelete);
          }

          const [updatedMemo] = await prisma.$transaction(async (prisma) => {
            const updatedMemo = await prisma.memo.update({
              data: {
                author: session?.user?.id,
                title: title,
                content: content,
              },
              where: {
                author: session?.user?.id,
                id: id,
              },
            });

            const deletedMemoImagesCount = await prisma.memoImage.deleteMany({
              where: {
                memoId: formValidation.data?.id,
              },
            });

            const createdMemoImagesCount =
              !isEmpty(uploadResults) &&
              (await prisma.memoImage.createMany({
                data: map(uploadResults, (url) => ({
                  url,
                  memoId: id!,
                })),
              }));

            return [updatedMemo, deletedMemoImagesCount, createdMemoImagesCount];
          });

          if (updatedMemo.id) {
            return {
              success: true,
              action: 'update' as ActionType,
              data: updatedMemo,
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
