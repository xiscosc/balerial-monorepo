<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import '../../app.css';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

{@render children?.()}

<style>
	@media print {
		:global(body),
		:global(html) {
			overflow: hidden !important;
			height: 210mm !important;
			max-height: 210mm !important;
		}
	}
</style>
