import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';

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
