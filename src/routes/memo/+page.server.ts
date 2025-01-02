import { ROOT_USER } from '$env/static/private';
import { prisma } from '$lib/prisma';
import { MemoWithImages } from '$lib/utils/prismaTypes';
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

  const [memos, memoTotalCount] = await Promise.all([
    prisma.memo.findMany({
      where: {
        author: session?.user?.id || rootUser?.id,
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
    prisma.memo.count({
      where: {
        author: session?.user?.id || rootUser?.id,
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

  const sanitizeMemos = sanitizeContents(memos) as MemoWithImages[];

  return {
    memos: sanitizeMemos,
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
      return redirect(302, '/memo');
    }

    const formData = await request.formData();
    const fromEntries = Object.fromEntries(formData);
    const imageFiles = formData.getAll('images') as File[];

    if (actionType === 'delete') {
      const formValidation = formDataSchema.pick({ id: true }).safeParse(fromEntries);
      if (formValidation.success) {
        const memoImages = await prisma.memoImage.findMany({
          select: {
            url: true,
          },
          where: {
            memoId: formValidation.data?.id,
            memo: {
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

        // 스토리지 이미지 업로드
        const validImageFiles = filter(imageFiles, (file) => file.size > 0 && file.name !== '');
        const uploadResults = !isEmpty(validImageFiles)
          ? await Promise.all(map(imageFiles, (file) => uploadPublicStorage(file, '/images/memo')))
          : [];

        const replaceContented = replaceBlobImageSrc(content, getPublicUrls(uploadResults));

        if (actionType === 'create') {
          const createdMemo = await prisma.memo.create({
            data: {
              author: session?.user?.id,
              title: title,
              content: sanitizeContents(replaceContented) as string,
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
          // TODO: 매번 수정시 마다 삭제하는거보다는 CronJob으로 정기적으로 불필요한것들 삭제하는게 효율적이니 나중에 수정
          // 스토리지 이미지 업데이트 시작
          const replaceContented = replaceBlobImageSrc(content, getPublicUrls(uploadResults));
          const sanitizedMemos = sanitizeContents(replaceContented) as string;

          const memoImages = await prisma.memoImage.findMany({
            select: {
              url: true,
            },
            where: {
              memoId: formValidation.data?.id,
              memo: {
                author: session?.user?.id,
              },
            },
          });

          const memoImageUrls = map(memoImages, (image) => image.url);
          const extractedImgSrc = getOriginUrls(extractImgSrc(sanitizedMemos));
          const diffExtracted = difference(memoImageUrls, extractedImgSrc);

          const urlsToDelete = map(diffExtracted, (imageUrl) => imageUrl);
          if (!isEmpty(urlsToDelete)) {
            await removePublicStorageFile(urlsToDelete);
          }
          // 스토리지 이미지 업데이트 끝

          const [updatedMemo] = await prisma.$transaction(async (prisma) => {
            const updatedMemo = await prisma.memo.update({
              data: {
                author: session?.user?.id,
                title: title,
                content: sanitizedMemos,
              },
              where: {
                author: session?.user?.id,
                id: id,
              },
            });

            const deletedImagesCount = await prisma.memoImage.deleteMany({
              where: {
                memoId: formValidation.data?.id,
                url: { in: diffExtracted },
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

            return [updatedMemo, deletedImagesCount, createdMemoImagesCount];
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
