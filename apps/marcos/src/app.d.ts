// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { TrackingContext } from '@/server/shared/tracking';
import type { AppUser } from '@marcsimolduressonsardina/core/type';
import type { ICoreConfiguration } from '@marcsimolduressonsardina/core/config';
import type { ServiceFactory } from '@marcsimolduressonsardina/core/service';
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			trackingContext: TrackingContext;
			user?: AppUser;
			config?: ICoreConfiguration;
			services?: ServiceFactory;
		}
	}
}

export {};
