import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!session?.user?.id) {
    return redirect(302, '/');
  }

  return {
    session,
  };
};
