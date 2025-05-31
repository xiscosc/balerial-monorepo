import { browser } from '$app/environment';
import { on } from 'svelte/events';

interface BreakpointState {
	isSm: () => boolean;
	isMd: () => boolean;
	isLg: () => boolean;
}

export class BreakpointStateClass implements BreakpointState {
	private sm = $state(false);
	private md = $state(false);
	private lg = $state(false);

	// Thresholds based on the original readable store logic
	private static readonly SM_THRESHOLD = 640;
	private static readonly MD_THRESHOLD = 768;
	private static readonly LG_THRESHOLD = 1024;

	private cleanupResizeListener: (() => void) | null = null;

	constructor() {
		if (browser) {
			this.handleResize();
			this.cleanupResizeListener = on(window, 'resize', this.handleResize);
		}
	}

	public destroy(): void {
		if (this.cleanupResizeListener) {
			this.cleanupResizeListener();
			this.cleanupResizeListener = null;
		}
	}

	public isSm(): boolean {
		return this.sm;
	}

	public isMd(): boolean {
		return this.md;
	}

	public isLg(): boolean {
		return this.lg;
	}

	private handleResize = (): void => {
		if (browser) {
			const width = window.innerWidth;
			this.sm = width <= BreakpointStateClass.SM_THRESHOLD;
			this.md = width <= BreakpointStateClass.MD_THRESHOLD;
			this.lg = width <= BreakpointStateClass.LG_THRESHOLD;
		}
	};
}
