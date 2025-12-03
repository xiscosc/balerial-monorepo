<script lang="ts">
	import { type Snippet } from 'svelte';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import type { LayoutData } from './$types';
	import '../../app.css';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { children }: Props = $props();
	injectSpeedInsights();
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

{@render children?.()}
