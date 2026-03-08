import { ENV_NAME, VERCEL_GIT_COMMIT_REF } from '$env/static/private';
import type { LayoutServerLoad } from './$types';
import { AuthService } from '@/server/service/auth.service';

export const load = (async ({ locals }) => {
	const envName =
		ENV_NAME === 'prod' || VERCEL_GIT_COMMIT_REF === 'preview'
			? ENV_NAME
			: VERCEL_GIT_COMMIT_REF;
	await AuthService.checkAuth(locals);
	return { user: locals.user!, envName };
}) satisfies LayoutServerLoad;
