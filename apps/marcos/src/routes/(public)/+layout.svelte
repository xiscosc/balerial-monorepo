<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../../app.css';
	import { browser } from '$app/environment';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	if (browser) {
		import('@m3e/loading-indicator');
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

{@render children?.()}
