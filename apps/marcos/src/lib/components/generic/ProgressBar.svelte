<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { Progress } from '@/components/ui/progress';

	interface Props {
		text: string;
		value: number;
		speed?: number;
		animated?: boolean;
		oncomplete?: (value: number) => void;
	}

	let { text, value, speed = 85, animated = true, oncomplete }: Props = $props();

	let current = $state(0);
	let interval: ReturnType<typeof setInterval> | null = null;

	function clear() {
		if (interval != null) {
			clearInterval(interval);
			interval = null;
		}
	}

	$effect(() => {
		const target = value;
		const isAnimated = animated;
		const tickMs = speed;
		untrack(() => {
			clear();
			if (!isAnimated || current === target) {
				current = target;
				oncomplete?.(current);
				return;
			}
			interval = setInterval(() => {
				if (current < target) current = Math.min(target, current + 1);
				else if (current > target) current = Math.max(target, current - 1);
				if (current === target) {
					clear();
					oncomplete?.(current);
				}
			}, tickMs);
		});
	});

	onDestroy(clear);
</script>

<div class="flex w-full flex-col gap-4 py-4">
	<div class="flex items-center justify-between gap-3">
		<span class="min-w-0 truncate text-base font-medium text-gray-900">{text}</span>
		<span class="shrink-0 text-lg font-semibold tabular-nums text-gray-900">{current}%</span>
	</div>
	<Progress value={current} class="h-3" />
</div>
