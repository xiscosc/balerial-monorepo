// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { TrackingContext } from '@/server/shared/tracking';
import type { AppUser } from '@marcsimolduressonsardina/core/type';
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			posthog: TrackingContext;
			user?: AppUser;
		}
	}
}

export {};
