import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { faker } from '@faker-js/faker/locale/en';

export const actions = {
  memoCreate: async ({ locals, request }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/');
    }

    const formData = Object.fromEntries(await request.formData());
    const { count } = formData;

    const totalCount = Number(count) || 1;
    const imageCount = faker.number.int({ min: 1, max: 8 });
    const now = new Date();

    const fakeMemos = Array.from({ length: totalCount }, (_, index) => ({
      author: session?.user?.id,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      created_at: new Date(now.getTime() - index * 1000),
    }));

    const [createdMemosCount] = await prisma.$transaction(async (prisma) => {
      const createdMemosCount = await prisma.memo.createMany({
        data: fakeMemos,
        skipDuplicates: true,
      });

      const createdMemos = await prisma.memo.findMany({
        where: { author: session?.user?.id },
        orderBy: { created_at: 'desc' },
        take: totalCount,
      });

      const fakeImages = createdMemos.flatMap((memo) =>
        Array.from({ length: imageCount }, () => ({
          memoId: memo.id,
          url: faker.image.url({ width: 400, height: 400 }),
        })),
      );

      const fakeImagesCount = await prisma.memoImage.createMany({ data: fakeImages });

      return [createdMemosCount, createdMemos, fakeImagesCount];
    });

    if (createdMemosCount.count > 0) {
      return {
        success: true,
        action: 'create' as ActionType,
        data: createdMemosCount,
      };
    }
  },
  memoDelete: async ({ locals }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/');
    }

    const res = await prisma.memo.deleteMany({
      where: {
        author: session?.user?.id,
      },
    });

    if (res) {
      return {
        success: true,
        action: 'delete' as ActionType,
        data: res,
      };
    }
  },
};
