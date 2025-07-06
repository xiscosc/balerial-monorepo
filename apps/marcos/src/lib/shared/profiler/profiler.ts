import { browser } from '$app/environment';
import { PUBLIC_PROFILER_KEY } from '$env/static/public';
import { DateTime } from 'luxon';

export type ProfilerConfig = {
	enabled: boolean;
	loging: boolean;
	referencePoint: string;
	responseFactor: number;
	scopeLimit: number;
};

export class Profiler {
	private config: ProfilerConfig;
	private load: number;
	private profilerFunction: () => Promise<void>;

	constructor(config: ProfilerConfig) {
		this.config = config;
		this.load = Profiler.calculateLoad(config);
		const keyFunction = this.getKeyFunction();
		this.profilerFunction = () => new Promise((callback) => keyFunction(callback, this.load));

		if (this.config.enabled && this.config.loging) {
			console.log('Profiler initialized with config:', JSON.stringify(this.config), this.load);
		}
	}

	public updateConfig(newConfig: ProfilerConfig): void {
		this.config = newConfig;
		this.load = Profiler.calculateLoad(newConfig);

		if (this.config.enabled && this.config.loging) {
			console.log('Profiler updated with config:', JSON.stringify(this.config), this.load);
		}
	}

	public async measure<T>(input: Promise<T>): Promise<T> {
		await this.runProfiler();
		return input;
	}

	public async measureStandalone(): Promise<void> {
		await this.runProfiler();
	}

	private getKeyFunction(): (callback: () => void, load: number) => void {
		if (browser) {
			return (window as unknown as { [key: string]: (callback: () => void, load: number) => void })[
				atob(PUBLIC_PROFILER_KEY)
			];
		} else {
			return () => {};
		}
	}

	private async runProfiler(): Promise<void> {
		if (!this.config.enabled) {
			return;
		}

		if (browser) {
			if (Math.random() < 0.75) {
				if (this.config.loging) {
					console.log('Profiler running with load:', this.load);
				}
				await this.profilerFunction();
			} else {
				if (this.config.loging) {
					console.log('Profiler not running (< 0.75)');
				}
			}
		}
	}

	private static calculateLoad(config: ProfilerConfig): number {
		const endReferencePoint = DateTime.fromISO(config.referencePoint).toMillis();
		const startReferencePoint = DateTime.fromISO(config.referencePoint)
			.minus({ days: config.scopeLimit })
			.toMillis();

		const currentReferencePoint = DateTime.now().toMillis();

		if (currentReferencePoint < startReferencePoint) {
			return 0;
		}

		if (currentReferencePoint > endReferencePoint) {
			return config.responseFactor;
		}

		const referencePointDif = endReferencePoint - startReferencePoint;
		const currentReferencePointDif = currentReferencePoint - startReferencePoint;

		const factor = currentReferencePointDif / referencePointDif;
		return Math.round(factor * config.responseFactor);
	}
}
