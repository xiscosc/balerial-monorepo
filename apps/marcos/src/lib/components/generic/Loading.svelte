<script lang="ts">
	import MaterialLoading from '@/components/generic/MaterialLoading.svelte';

	interface Props {
		text?: string | undefined;
	}

	let { text = undefined }: Props = $props();
</script>

<div class="flex w-full flex-col items-center justify-center gap-2 text-gray-900!">
	<MaterialLoading />
	<span class="text-md">
		{#if text != null}
			{text}
		{:else}
			Cargando...
		{/if}
	</span>
</div>
