<script lang="ts">
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';

	interface Props {
		text?: string | undefined;
		icon?: IconType;
	}

	let { text = undefined, icon = IconType.LOADING_BALL }: Props = $props();
</script>

<div class="flex w-full flex-col items-center justify-center gap-2 text-gray-900!">
	<div class="animate-spin">
		<Icon size={IconSize.XXL} type={icon} />
	</div>
	<span class="text-md">
		{#if text != null}
			{text}
		{:else}
			Cargando...
		{/if}
	</span>
</div>
