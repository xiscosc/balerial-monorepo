<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import {
		ButtonVariant,
		ButtonTextVariant,
		ButtonSize
	} from '@/components/generic/button/button.enum';
	import { IconSize } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { cn } from '@/utils';
	import type { IMarcosButtonProps } from '@/components/generic/button/MarcosButtonProps.interface';

	interface Properties extends IMarcosButtonProps, HTMLButtonAttributes {}

	let {
		children = undefined,
		variant = ButtonVariant.NEUTRAL,
		size = ButtonSize.DEFAULT,
		textVariant = ButtonTextVariant.WHITE,
		iconSize = IconSize.DEFAULT,
		icon = undefined,
		...others
	}: Properties = $props();
</script>

<button
	type="button"
	{...others}
	class={cn(
		'po w-full flex-1',
		others.disabled ? ButtonVariant.DISABLED : variant,
		others.disabled ? 'cursor-not-allowed' : 'cursor-pointer',
		size,
		textVariant,
		size === ButtonSize.SMALL ? 'flex items-center justify-center text-xs' : '',
		others.class
	)}
>
	<div class="flex items-center gap-2 p-0" class:justify-center={size !== ButtonSize.HOME}>
		{#if icon}
			<Icon type={icon} size={iconSize} />
		{/if}
		{#if children}
			<span>
				{@render children()}
			</span>
		{/if}
	</div>
</button>
