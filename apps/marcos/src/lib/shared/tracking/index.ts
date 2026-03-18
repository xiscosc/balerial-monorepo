import { dev } from '$app/environment';
import { PUBLIC_TRACKING_DISABLED } from '$env/static/public';
import type { IClientTracking } from './tracking.interface';
import { PostHogTracking } from './posthog.tracking';
import { NoOpTracking } from './noop.tracking';

function createTracking(): IClientTracking {
	if (dev || PUBLIC_TRACKING_DISABLED === 'true') {
		return new NoOpTracking();
	}
	return new PostHogTracking();
}

export const Tracking = createTracking();
export type { IClientTracking } from './tracking.interface';
