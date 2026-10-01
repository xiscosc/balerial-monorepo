<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
	const viewport = $derived(
		page.route.id?.startsWith('/(app)')
			? 'width=device-width, initial-scale=1, viewport-fit=cover'
			: 'width=device-width, initial-scale=1'
	);
</script>

<svelte:head>
	<meta name="viewport" content={viewport} />
</svelte:head>

{@render children()}
