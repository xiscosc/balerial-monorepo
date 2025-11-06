<script lang="ts">
	import type { Snippet } from 'svelte';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';

	interface Properties {
		children?: Snippet;
		enabled?: boolean;
		text: string;
	}

	let { children, text, enabled = true }: Properties = $props();
</script>

{#if enabled}
	<div class="group relative w-full flex-1" tabindex="0" role="button">
		<div class="flex">
			{@render children?.()}
		</div>
		{#if text != null}
			<div
				class="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 transform rounded-lg bg-gray-800 px-4 py-2 text-base text-white group-focus-within:flex group-hover:flex group-focus:flex"
			>
				<TriangleAlert class="mr-2" />
				<span>{text}</span>
			</div>
		{/if}
	</div>
{:else}
	{@render children?.()}
{/if}
