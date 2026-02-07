import posthog, { type Properties } from 'posthog-js';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { browser, dev } from '$app/environment';
import type { AppUser } from '@marcsimolduressonsardina/core/type';

export function initPosthog(envName: string, appUser?: AppUser) {
	if (browser) {
		if (dev) {
			console.log('dev - initPosthog', envName, appUser);
			return;
		}

		posthog.init(PUBLIC_POSTHOG_KEY, {
			api_host: 'https://eu.i.posthog.com',
			person_profiles: 'identified_only',
			autocapture: false,
			loaded: (ph) => {
				ph.register({
					env: envName,
					store: appUser ? appUser.storeId : 'not_available'
				});
			}
		});

		if (appUser) {
			identifyUser(appUser, envName);
		}
	}
}

export function identifyUser(appUser: AppUser, envName: string) {
	if (browser) {
		if (dev) {
			console.log('dev - identifyUser', appUser, envName);
			return;
		}

		posthog.identify(appUser.id, {
			email: appUser.id,
			name: appUser.name,
			userEnv: envName
		});
	}
}

export function trackEvent(eventName: string, properties: Properties = {}) {
	if (browser) {
		if (dev) {
			console.log('dev - trackEvent', eventName, properties);
			return;
		}

		posthog.capture(eventName, properties);
	}
}

export function trackError(error: Error, properties: Properties = {}) {
	if (browser) {
		if (dev) {
			console.log('dev - trackError', error, properties);
			return true;
		}

		const result = posthog.captureException(error, properties);
		return result !== undefined;
	}

	return false;
}
