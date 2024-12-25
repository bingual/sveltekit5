import { prisma } from '$lib/prisma';
import { storageManager } from '$lib/utils/variables.server';

import { faker } from '@faker-js/faker/locale/en';
import { redirect } from '@sveltejs/kit';
import { flatMap, isEmpty, join, map, omit, pipe, range } from 'remeda';

import type { Actions } from './$types';

export const actions = {
  memoCreate: async ({ locals, request }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/');
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
        join('\n'),
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

    const fakeMemos = pipe(
      range(0, totalCount),
      map((index) => {
        const { content, imageUrls } = generateRandomHtml();
        return {
          author: session?.user?.id,
          title: faker.lorem.sentence(),
          content: content,
          created_at: new Date(now.getTime() - index * 1000),
          memoImages: imageUrls,
        };
      }),
    );

    const [createdMemosCount] = await prisma.$transaction(async (prisma) => {
      const createdMemosCount = await prisma.memo.createMany({
        data: map(fakeMemos, (fakeMemo) => omit(fakeMemo, ['memoImages'])),
        skipDuplicates: true,
      });

      const createdMemos = await prisma.memo.findMany({
        select: { id: true },
        where: { author: session?.user?.id },
        orderBy: { created_at: 'desc' },
        take: createdMemosCount.count,
      });

      const createdImages = pipe(
        createdMemos,
        flatMap((memo, memoIndex) =>
          pipe(
            fakeMemos[memoIndex].memoImages,
            map((imageUrl) => ({
              memoId: memo.id,
              url: imageUrl,
            })),
          ),
        ),
      );

      const fakeImagesCount = await prisma.memoImage.createMany({ data: createdImages });

      return [createdMemosCount, createdImages, fakeImagesCount];
    });

    if (createdMemosCount.count > 0) {
      return {
        success: true,
        action: 'create' as ActionType,
        data: createdMemosCount.count,
      };
    }
  },
  memoDelete: async ({ locals }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/');
    }

    const memoImages = await prisma.memoImage.findMany({
      where: {
        memo: {
          author: session?.user?.id,
        },
      },
    });

    const { removePublicStorageFile } = storageManager();

    const urlsToDelete = map(memoImages, (image) => image.url);
    if (!isEmpty(urlsToDelete)) {
      await removePublicStorageFile(urlsToDelete);
    }

    const memoDeleted = await prisma.memo.deleteMany({
      where: {
        author: session?.user?.id,
      },
    });

    if (memoDeleted.count > 0) {
      return {
        success: true,
        action: 'delete' as ActionType,
        data: memoDeleted.count,
      };
    }
  },
} satisfies Actions;
