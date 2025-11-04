<script lang="ts">
	import { type HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
	import { IconSize, type IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { cn } from '@/utils';

	interface Properties extends HTMLAnchorAttributes {
		children?: Snippet;
		variant?: ButtonStyle;
		textVariant?: ButtonText;
		size?: ButtonType;
		icon?: IconType;
		iconSize?: IconSize;
		class?: string | undefined | null;
	}

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
