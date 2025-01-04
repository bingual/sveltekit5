import { postAction } from '$lib/server/action/handler.server';

import type { Actions } from './$types';

export const actions = {
  create: async ({ locals, request }) => {
    return await postAction(locals, request, 'create');
  },
} satisfies Actions;
