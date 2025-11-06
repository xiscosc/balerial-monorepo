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

	function handleClick(event: MouseEvent) {
		if (disabled) {
			event.preventDefault();
		}
	}
</script>

<a
	{...others}
	class={cn(
		'w-full flex-1',
		disabled ? ButtonStyle.DISABLED : variant,
		size,
		textVariant,
		size === ButtonType.SMALL ? 'flex items-center justify-center text-xs' : '',
		others.class
	)}
	onclick={handleClick}
	aria-disabled={disabled}
>
	<div class="flex items-center gap-2 p-0" class:justify-center={size !== ButtonType.HOME}>
		{#if icon}
			<Icon type={icon} size={iconSize} />
		{/if}
		{#if children}
			<span>
				{@render children()}
			</span>
		{/if}
	</div>
</a>
