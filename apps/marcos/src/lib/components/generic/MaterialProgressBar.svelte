<script lang="ts">
	interface Props {
		value: number;
	}
	let { value }: Props = $props();

	let bufferValue = $derived(Math.min(value + 10, 100));
</script>

<div class="w-full">
	<m3e-linear-progress-indicator class="loading-bar" mode="buffer" {value} {bufferValue}
	></m3e-linear-progress-indicator>
</div>

<style>
	.loading-bar {
		--m3e-progress-indicator-color: var(--color-gray-700);
		--m3e-progress-indicator-track-color: var(--color-gray-100);
	}
</style>
