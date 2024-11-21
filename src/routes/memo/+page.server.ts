import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';
import { FormDataSchema } from './schema';
import { fail, redirect } from '@sveltejs/kit';

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

// TODO: 다중 이미지 업로드 기능 구현
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

    const formData = Object.fromEntries(await request.formData());
    if (actionType === 'delete') {
      const formValidation = FormDataSchema.pick({ id: true }).safeParse(formData);
      if (formValidation.success) {
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
        return fail(400, { status: false, errors });
      }
    } else {
      const formValidation = FormDataSchema.safeParse(formData);
      if (formValidation.success) {
        const { id, title, content } = formValidation.data;

        if (actionType === 'create') {
          const res = await prisma.memo.create({
            data: {
              author: session?.user?.id,
              title: title,
              content: content,
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
          const res = await prisma.memo.update({
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

          if (res.id) {
            return {
              success: true,
              action: 'update' as ActionType,
              data: res,
            };
          }
        }
      } else {
        const errors = formValidation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        }));

        return fail(400, { status: false, errors });
      }
    }
  } catch (err) {
    console.error(err);
  }
};
