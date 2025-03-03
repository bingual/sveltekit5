import { prisma } from '$lib/prisma';
import { formDataSchema } from '$lib/utils/schema';
import { sanitizeContents, storageManager } from '$lib/utils/variables.server';

import { fail, redirect } from '@sveltejs/kit';
import { difference, filter, isEmpty, map } from 'remeda';

const {
  getPublicUrls,
  getOriginUrls,
  removePublicStorageFile,
  uploadPublicStorage,
  replaceBlobImageSrc,
  extractImgSrc,
} = storageManager();

export const postAction = async (locals: App.Locals, request: Request, actionType: ActionType) => {
  try {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/general/posts');
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
              userId: session?.user?.id,
            },
          },
        });

        const urlsToDelete = map(postImages, (image) => image.url);
        if (!isEmpty(urlsToDelete)) {
          await removePublicStorageFile(urlsToDelete);
        }

        const deletedPost = await prisma.post.delete({
          where: {
            userId: session?.user?.id,
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
              userId: session?.user?.id,
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
                userId: session?.user?.id,
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
                userId: session?.user?.id,
                title: title,
                content: sanitizedPosts,
              },
              where: {
                userId: session?.user?.id,
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
