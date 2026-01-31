import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from './auth';
import { posthogContextHandle } from '@/server/shared/server-analytics/posthog';
import { getUserHandle } from '@/server/shared/auth/user';
import { apiAuthHandle } from '@/server/shared/auth/api';
import { handleErrorWithPostHog } from '@/server/shared/server-analytics/posthog.error-handle';
import { versionHandle } from '@/server/version/version.handle';

export const handle = sequence(
	versionHandle,
	authHandle,
	getUserHandle,
	apiAuthHandle,
	posthogContextHandle
);
export const handleError = handleErrorWithPostHog;
