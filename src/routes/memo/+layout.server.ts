import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
  const { session } = await parent();

  return {
    session,
  };
};
