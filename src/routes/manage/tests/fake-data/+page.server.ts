import { prisma } from '$lib/prisma';
import { storageManager } from '$lib/utils/variables.server';

import { faker } from '@faker-js/faker/locale/en';
import { redirect } from '@sveltejs/kit';
import { flatMap, isEmpty, join, map, omit, pipe, range } from 'remeda';

import type { Actions } from './$types';

export const actions = {
  postCreate: async ({ locals, request }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/general');
    }

    const formData = Object.fromEntries(await request.formData());
    const { count } = formData;

    const totalCount = Number(count) || 1;
    const now = new Date();

    const generateRandomHtml = () => {
      const headings = pipe(
        range(0, faker.number.int({ min: 1, max: 3 })),
        map(() => {
          const headingLevel = faker.number.int({ min: 1, max: 3 });
          return `<h${headingLevel}>${faker.lorem.sentence()}</h${headingLevel}>`;
        }),
        join(''),
      );

      const paragraphs = pipe(
        range(0, faker.number.int({ min: 2, max: 5 })),
        map(() => `<p>${faker.lorem.paragraph()}</p>`),
        join(''),
      );

      const listItems = pipe(
        range(0, faker.number.int({ min: 3, max: 7 })),
        map(() => `<li>${faker.lorem.sentence()}</li>`),
        join(''),
      );

      const lists = `<ul>${listItems}</ul>`;

      const imageUrls = pipe(
        range(0, faker.number.int({ min: 1, max: 8 })),
        map(() => faker.image.url({ width: 400, height: 400 })),
      );

      const imgTags = pipe(
        imageUrls,
        map((imageUrl, index) => `<img src="${imageUrl}" alt="Image ${index + 1}" />`),
      );

      // 조합된 HTML 반환
      return {
        content: `
      ${headings}
      ${paragraphs}
      ${lists}
      ${imgTags}
    `,
        imageUrls: imageUrls,
      };
    };

    const fakePosts = pipe(
      range(0, totalCount),
      map((index) => {
        const { content, imageUrls } = generateRandomHtml();
        return {
          userId: session?.user?.id,
          title: faker.lorem.sentence(),
          content: content,
          createdAt: new Date(now.getTime() - index * 1000),
          postImages: imageUrls,
        };
      }),
    );

    const [createdPostsCount] = await prisma.$transaction(async (prisma) => {
      const createdPostsCount = await prisma.post.createMany({
        data: map(fakePosts, (fakePost) => omit(fakePost, ['postImages'])),
        skipDuplicates: true,
      });

      const createdPosts = await prisma.post.findMany({
        select: { id: true },
        where: { userId: session?.user?.id },
        orderBy: { createdAt: 'desc' },
        take: createdPostsCount.count,
      });

      const createdImages = pipe(
        createdPosts,
        flatMap((post, postIndex) =>
          pipe(
            fakePosts[postIndex].postImages,
            map((imageUrl) => ({
              postId: post.id,
              url: imageUrl,
            })),
          ),
        ),
      );

      const fakeImagesCount = await prisma.postImage.createMany({ data: createdImages });

      return [createdPostsCount, createdImages, fakeImagesCount];
    });

    if (createdPostsCount.count > 0) {
      return {
        success: true,
        action: 'create' as ActionType,
        data: createdPostsCount.count,
      };
    }
  },
  postDelete: async ({ locals }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/general');
    }

    const postImages = await prisma.postImage.findMany({
      where: {
        post: {
          userId: session?.user?.id,
        },
      },
    });

    const { removePublicStorageFile } = storageManager();

    const urlsToDelete = map(postImages, (image) => image.url);
    if (!isEmpty(urlsToDelete)) {
      await removePublicStorageFile(urlsToDelete);
    }

    const postDeleted = await prisma.post.deleteMany({
      where: {
        userId: session?.user?.id,
      },
    });

    if (postDeleted.count > 0) {
      return {
        success: true,
        action: 'delete' as ActionType,
        data: postDeleted.count,
      };
    }
  },
} satisfies Actions;
