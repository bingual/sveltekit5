import { signIn, signOut } from '$lib/auth';
import type { Actions } from './$types';

export const actions: Actions = {
  signIn: signIn,
  signOut: signOut,
};
