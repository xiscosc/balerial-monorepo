import posthog, { type Properties } from 'posthog-js';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { browser, dev } from '$app/environment';
import type { AppUser } from '@marcsimolduressonsardina/core/type';

export function initPosthog(envName: string, appUser?: AppUser) {
	if (dev) {
		console.log('dev - initPosthog', envName, appUser);
		return;
	}

	if (browser) {
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
	if (dev) {
		console.log('dev - identifyUser', appUser, envName);
		return;
	}

	if (browser) {
		posthog.identify(appUser.id, {
			email: appUser.id,
			name: appUser.name,
			userEnv: envName
		});
	}
}

export function trackEvent(eventName: string, properties: Properties = {}) {
	if (dev) {
		console.log('dev - trackEvent', eventName, properties);
		return;
	}

	if (browser) {
		posthog.capture(eventName, properties);
	}
}

export function trackError(error: Error, properties: Properties = {}) {
	if (dev) {
		console.log('dev - trackError', error, properties);
		return;
	}

	if (browser) {
		posthog.captureException(error, properties);
	}
}
