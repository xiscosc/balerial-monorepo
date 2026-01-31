import { PUBLIC_VERCEL_GIT_COMMIT_SHA } from '$env/static/public';

export const APP_VERSION = PUBLIC_VERCEL_GIT_COMMIT_SHA || Date.now().toString();
