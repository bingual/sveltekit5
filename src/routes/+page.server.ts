import { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async () => {
  const users = await prisma.user.findMany();

  return {
    users,
  };
};
