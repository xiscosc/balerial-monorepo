<script lang="ts">
	import { type Snippet, onMount } from 'svelte';
	import '../../app.css';
	import type { LayoutData } from './$types';
	import { initPosthog } from '@/shared/fronted-analytics/posthog';
	import { browser } from '$app/environment';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	if (browser) {
		import('@m3e/loading-indicator');
	}

	onMount(() => {
		initPosthog(data.envName);
	});
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#F7F5F2]">
	{@render children?.()}
</div>
