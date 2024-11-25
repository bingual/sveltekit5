import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!dev) {
    return redirect(302, '/404');
  }

  if (!session?.user?.id) {
    return redirect(302, '/');
  }

  return {
    session,
  };
};
