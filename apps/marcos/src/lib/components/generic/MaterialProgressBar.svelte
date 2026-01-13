<script lang="ts">
	interface Props {
		value: number;
	}
	let { value }: Props = $props();
</script>

<div class="w-full">
	<m3e-linear-progress-indicator variant="wavy" class="loading-bar" {value}></m3e-linear-progress-indicator>
</div>

<style>
	.loading-bar {
		--m3e-progress-indicator-color: var(--color-gray-800);
		--m3e-progress-indicator-track-color: var(--color-gray-200);
		--m3e-linear-progress-indicator-thickness: 0.4rem;
	}
</style>
