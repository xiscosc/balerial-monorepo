import { ENV_NAME, VERCEL_GIT_COMMIT_REF } from '$env/static/private';
import type { LayoutServerLoad } from './$types';
import { AuthService } from '@/server/service/auth.service';

export const load = (async ({ locals }) => {
	const featureName = ENV_NAME === 'pre' ? 'pre' : VERCEL_GIT_COMMIT_REF;
	const featureBranch = ENV_NAME === 'prod' ? undefined : featureName;
	await AuthService.checkAuth(locals);
	return { user: locals.user!, envName: ENV_NAME, featureBranch };
}) satisfies LayoutServerLoad;
