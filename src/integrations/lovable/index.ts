// Lovable Cloud Auth is only available on *.lovable.app domains.
// On custom domains (e.g. totum.pixelsystem.online) we use Supabase Auth directly.
// This stub prevents build errors from the removed @lovable.dev/cloud-auth-js package.

export const lovable = {
  auth: {
    signInWithOAuth: null as null,
  },
};
