import { trackEvent } from '@/shared/fronted-analytics/posthog';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import { browser, dev } from '$app/environment';

const MAX_AGE_MINUTES = 5;

export class ExternalOrderPriceTrackerState {
	private createdAt: DateTime;
	private currentId: string;
	private missingReasonsCount: number;
	private total: number;

	constructor(private isExternal: boolean) {
		this.createdAt = DateTime.now();
		this.currentId = uuidv4();
		this.missingReasonsCount = $state(0);
		this.total = $state(0);

		$effect(() => {
			this.track(this.missingReasonsCount, this.total);
		});
	}

	public setMissingReasonsCount(count: number) {
		this.missingReasonsCount = count;
	}

	public setTotal(total: number) {
		this.total = total;
	}

	private track(missingReasonsCount: number, total: number) {
		if (browser) {
			if (!this.isExternal) {
				return;
			}

			if (missingReasonsCount > 0 || total <= 0) {
				if (dev) {
					console.log(
						'[ExternalOrderPriceTracker - dev] Not tracking price calculation due to missing reasons'
					);
				}
				return;
			}

			this.renewCurrentId();
			trackEvent('External Order Price Calculated', {
				total,
				externalOrderSession: this.currentId
			});
			if (dev) {
				console.log('[ExternalOrderPriceTracker - dev] Tracked price calculation', {
					total,
					externalOrderSession: this.currentId
				});
			}
		}
	}

	private renewCurrentId() {
		if (DateTime.now().diff(this.createdAt, 'minutes').minutes > MAX_AGE_MINUTES) {
			this.createdAt = DateTime.now();
			this.currentId = uuidv4();
		}
	}
}
