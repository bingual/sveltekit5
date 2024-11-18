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
    const now = new Date();

    const fakeMemos = Array.from({ length: totalCount }, (_, index) => ({
      author: session?.user?.id,
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      created_at: new Date(now.getTime() - index * 1000),
    }));

    const res = await prisma.memo.createMany({
      data: fakeMemos,
    });

    if (res) {
      return {
        success: true,
        action: 'create' as ActionType,
        data: res,
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
