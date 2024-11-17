import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';
import { FormDataSchema } from './schema';
import { fail, redirect } from '@sveltejs/kit';

// TODO: 더보기 기능 구현
export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();

  const memos = await prisma.memo.findMany({
    where: {
      author: session?.user?.id,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return {
    memos,
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
            result: {
              data: res,
            },
          };
        }
      } else {
        const errors = formValidation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        }));

        console.error(errors);
        return fail(400, { error: true, errors });
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
              result: {
                data: res,
              },
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
              result: {
                data: res,
              },
            };
          }
        }
      } else {
        const errors = formValidation.error.errors.map((err) => ({
          field: err.path[0],
          message: err.message,
        }));

        console.error(errors);
        return fail(400, { error: true, errors });
      }
    }
  } catch (err) {
    console.error(err);
  }
};
