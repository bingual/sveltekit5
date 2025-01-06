import { dev } from '$app/environment';

import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!dev) {
    return redirect(302, '/404');
  }

  return {
    session,
  };
};
