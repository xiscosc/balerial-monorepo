import { browser } from '$app/environment';
import { AnalyticsGateway } from '@/gateway/analytics-api.gateway';
import { DateTime } from 'luxon';

export class OrderFormExternalCalculationState {
	private static maxTime = 5 * 60 * 1000;
	private showPrices: boolean;
	private shouldRecalculate: boolean;
	private lastCalculationDate?: DateTime;
	private hideTimeout?: ReturnType<typeof setTimeout>;
	private visibilityChangeListener: () => void;
	private isCalculating: boolean;

	constructor(isExternal: boolean) {
		this.isCalculating = $state(false);
		this.showPrices = $state(!isExternal);
		this.lastCalculationDate = $state(undefined);
		this.shouldRecalculate = $derived(
			OrderFormExternalCalculationState.isCalculationNeeded(
				this.showPrices,
				this.lastCalculationDate
			)
		);

		if (!isExternal && browser) {
			this.visibilityChangeListener = () => {
				if (document.visibilityState === 'visible') {
					this.checkDate();
				}
			};

			if (typeof document !== 'undefined') {
				document.addEventListener('visibilitychange', this.visibilityChangeListener);
			}
		} else {
			this.visibilityChangeListener = () => {};
		}
	}

	public destroy() {
		if (browser) {
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', this.visibilityChangeListener);
			}
			if (this.hideTimeout) {
				clearTimeout(this.hideTimeout);
			}
		}
	}

	private checkDate() {
		if (this.showPrices && this.lastCalculationDate) {
			const timeSinceCalculation = DateTime.now().diff(this.lastCalculationDate).toMillis();
			if (timeSinceCalculation >= OrderFormExternalCalculationState.maxTime) {
				this.showPrices = false;
			}
		}
	}

	public getShowPrices(): boolean {
		this.checkDate();
		return this.showPrices;
	}

	public getIsCalculating(): boolean {
		return this.isCalculating;
	}

	public async calculatePrices(total: number) {
		if (!this.shouldRecalculate) return;
		this.isCalculating = true;
		await AnalyticsGateway.trackExternalOrderCalculation(true, total);
		this.showPrices = true;
		this.isCalculating = false;
		this.lastCalculationDate = DateTime.now();

		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
		}

		this.hideTimeout = setTimeout(() => {
			this.showPrices = false;
			this.hideTimeout = undefined;
		}, OrderFormExternalCalculationState.maxTime);
	}

	private static isCalculationNeeded(showPrices: boolean, lastCalculationDate?: DateTime): boolean {
		if (!showPrices) return true;
		if (!lastCalculationDate) return true;

		const timeSinceLastCalculation = DateTime.now().diff(lastCalculationDate).toMillis();
		return timeSinceLastCalculation > OrderFormExternalCalculationState.maxTime;
	}
}
