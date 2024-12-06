import { prisma } from '$lib/prisma';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { DefaultSession, SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';

declare module '@auth/sveltekit' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  trustHost: true,
  callbacks: {
    session: async ({ session }) => {
      return session;
    },
  },
});
