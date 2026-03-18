<script lang="ts">
	import { type Snippet, onMount } from 'svelte';
	import '../../app.css';
	import type { LayoutData } from './$types';
	import { Tracking } from '@/shared/tracking';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	injectSpeedInsights();
	onMount(() => {
		Tracking.init(data.envName);
	});
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#F7F5F2]">
	{@render children?.()}
</div>
