<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ButtonType } from '@/components/generic/button/button.enum';
	import TriangleAlert from 'lucide-svelte/icons/triangle-alert';

	interface Properties {
		children?: Snippet;
		buttonSize?: ButtonType;
		enabled?: boolean;
		text: string;
	}

	let { children, text, buttonSize = ButtonType.DEFAULT, enabled = true }: Properties = $props();
</script>

{#if enabled}
	<div
		class="group relative"
		class:w-full={buttonSize !== ButtonType.SMALL}
		tabindex="0"
		role="button"
	>
		{@render children?.()}
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
