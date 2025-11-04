<script lang="ts">
	import { type HTMLAnchorAttributes } from 'svelte/elements';
	import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
	import { IconSize } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { cn } from '@/utils';
	import type { IMarcosButtonProps } from '@/components/generic/button/MarcosButtonProps.interface';

	interface Properties extends IMarcosButtonProps, HTMLAnchorAttributes {}

	let {
		children = undefined,
		variant = ButtonStyle.NEUTRAL,
		size = ButtonType.DEFAULT,
		textVariant = ButtonText.WHITE,
		iconSize = IconSize.DEFAULT,
		icon = undefined,
		...others
	}: Properties = $props();
</script>

<a
	{...others}
	class={cn(variant, size, textVariant, others.class)}
	class:w-full={size !== ButtonType.SMALL}
>
	<span class="flex items-center gap-2 p-0" class:justify-center={size !== ButtonType.HOME}>
		{#if icon}
			<Icon type={icon} size={iconSize} />
		{/if}
		{@render children?.()}
	</span>
</a>
