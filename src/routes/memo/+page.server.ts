import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';
import { formDataSchema } from './schema';
import { fail, redirect } from '@sveltejs/kit';
import { storageManager } from '$lib/utils/variables.server';
import { isEmpty } from 'remeda';

const { removePublicStorageFile, uploadPublicStorage } = storageManager();

export const load: PageServerLoad = async ({ parent, url }) => {
  const { session } = await parent();

  const searchParams = url.searchParams;
  const take = Number(searchParams.get('take')) || 10;
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

        const urlsToDelete = memoImages.map((image) => image.url);
        if (!isEmpty(urlsToDelete)) {
          await removePublicStorageFile(urlsToDelete);
        }

        const res = await prisma.memo.delete({
          where: {
            author: session?.user?.id,
            id: formValidation.data?.id,
          },
        });

        if (res.id) {
          return {
            success: true,
            action: 'delete' as ActionType,
            data: res,
          };
        }
      } else {
        const errors = formValidation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        }));
        return fail(400, { success: false, errors });
      }
    } else {
      const formValidation = formDataSchema.safeParse(fromEntries);

      if (formValidation.success) {
        const { id, title, content } = formValidation.data;

        const validImageFiles = imageFiles.filter((file) => file.size > 0 && file.name !== '');
        const uploadResults = !isEmpty(validImageFiles)
          ? await Promise.all(imageFiles.map((file) => uploadPublicStorage(file, '/images/memo')))
          : [];

        if (actionType === 'create') {
          const res = await prisma.memo.create({
            data: {
              author: session?.user?.id,
              title: title,
              content: content,
              images: {
                create: uploadResults.map((url) => ({
                  url,
                })),
              },
            },
          });

          if (res.id) {
            return {
              success: true,
              action: 'create' as ActionType,
              data: res,
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

          const urlsToDelete = memoImages.map((image) => image.url);
          if (!isEmpty(urlsToDelete)) {
            await removePublicStorageFile(urlsToDelete);
          }

          const [updateResult, deleteManyResult, createManyResult] = await prisma.$transaction([
            prisma.memo.update({
              data: {
                author: session?.user?.id,
                title: title,
                content: content,
              },
              where: {
                author: session?.user?.id,
                id: id,
              },
            }),
            prisma.memoImage.deleteMany({
              where: {
                memoId: formValidation.data?.id,
              },
            }),
            ...(!isEmpty(uploadResults)
              ? [
                  prisma.memoImage.createMany({
                    data: uploadResults.map((url) => ({
                      url,
                      memoId: id!,
                    })),
                  }),
                ]
              : []),
          ]);

          if (updateResult.id) {
            return {
              success: true,
              action: 'update' as ActionType,
              data: updateResult,
            };
          }
        }
      } else {
        const errors = formValidation.error?.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        }));

        return fail(400, { success: false, errors });
      }
    }
  } catch (err) {
    console.error(err);
  }
};
