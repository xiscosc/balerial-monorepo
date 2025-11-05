<script lang="ts">
	import { type HTMLAnchorAttributes } from 'svelte/elements';
	import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
	import { IconSize } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { cn } from '@/utils';
	import type { IMarcosButtonProps } from '@/components/generic/button/MarcosButtonProps.interface';

	interface Properties extends IMarcosButtonProps, HTMLAnchorAttributes {
		disabled?: boolean;
	}

	let {
		children = undefined,
		variant = ButtonStyle.NEUTRAL,
		size = ButtonType.DEFAULT,
		textVariant = ButtonText.WHITE,
		iconSize = IconSize.DEFAULT,
		icon = undefined,
		disabled = false,
		...others
	}: Properties = $props();
</script>

<a
	{...others}
	class={cn(
		disabled ? ButtonStyle.DISABLED : variant,
		size,
		textVariant,
		size === ButtonType.SMALL ? 'flex items-center' : '',
		others.class
	)}
	aria-disabled={disabled}
	class:w-full={size !== ButtonType.SMALL}
>
	<div class="flex items-center gap-2 p-0" class:justify-center={size !== ButtonType.HOME}>
		{#if icon}
			<Icon type={icon} size={iconSize} />
		{/if}
		<span>
			{@render children?.()}
		</span>
	</div>
</a>
