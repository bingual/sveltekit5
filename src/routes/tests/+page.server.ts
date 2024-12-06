import { redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  return {
    test: 'test',
  };
};

export const actions = {
  default: async ({ locals, request }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return redirect(302, '/');
    }

    return {};
  },
} satisfies Actions;
