import { prisma } from '$lib/prisma';
import { storageManager } from '$lib/utils/variables.server';

import { faker } from '@faker-js/faker/locale/en';
import { redirect } from '@sveltejs/kit';
import { isEmpty, join, map, pipe, range } from 'remeda';

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

      const imgUrls = pipe(
        range(0, faker.number.int({ min: 1, max: 8 })),
        map(() => ({
          url: faker.image.url({ width: 400, height: 400 }),
        })),
      );

      const imgTags = pipe(
        imgUrls,
        map((value, index) => `<img src="${value.url}" alt="Image ${index + 1}" />`),
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
        imgUrls: imgUrls,
      };
    };

    const fakeMemos = pipe(
      range(0, totalCount),
      map((index) => {
        const { content, imgUrls } = generateRandomHtml();
        return {
          author: session?.user?.id,
          title: faker.lorem.sentence(),
          content: content,
          created_at: new Date(now.getTime() - index * 1000),
          images: map(imgUrls, (value) => ({ url: value.url })),
        };
      }),
    );

    const createdMemos = await Promise.all(
      map(fakeMemos, async (memo) => {
        return prisma.memo.create({
          data: {
            author: memo.author,
            title: memo.title,
            content: memo.content,
            created_at: memo.created_at,
            images: {
              create: memo.images,
            },
          },
        });
      }),
    );

    if (createdMemos.length > 0) {
      return {
        success: true,
        action: 'create' as ActionType,
        data: createdMemos.length,
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
        Memo: {
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
