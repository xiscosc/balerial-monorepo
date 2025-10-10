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
			margin: 0 !important;
			padding: 0 !important;
		}
	}
</style>
