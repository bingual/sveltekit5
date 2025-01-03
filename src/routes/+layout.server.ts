import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const session = await locals.auth();

  if (url.pathname === '/') {
    return redirect(302, '/general');
  }

  return {
    session,
  };
};
