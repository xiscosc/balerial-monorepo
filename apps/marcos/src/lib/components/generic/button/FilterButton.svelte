<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, type ButtonProps } from '@/components/ui/button/index.js';
	import type { BannerColor } from '@/components/generic/Banner.svelte';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconSize, type IconType } from '@/components/generic/icon/icon.enum';
	import { cn } from '@/utils';

	const iconColors: Record<BannerColor, string> = {
		blue: 'text-blue-600',
		red: 'text-red-700',
		green: 'text-green-700',
		purple: 'text-purple-600',
		amber: 'text-amber-600',
		violet: 'text-violet-600',
		indigo: 'text-indigo-600',
		teal: 'text-teal-600',
		sky: 'text-sky-600'
	};

	const selectedTintColors: Record<BannerColor, string> = {
		blue: 'border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-100',
		red: 'border-red-300 bg-red-100 text-red-800 hover:bg-red-100',
		green: 'border-green-300 bg-green-100 text-green-800 hover:bg-green-100',
		purple: 'border-purple-300 bg-purple-100 text-purple-800 hover:bg-purple-100',
		amber: 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100',
		violet: 'border-violet-300 bg-violet-100 text-violet-800 hover:bg-violet-100',
		indigo: 'border-indigo-300 bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
		teal: 'border-teal-300 bg-teal-100 text-teal-800 hover:bg-teal-100',
		sky: 'border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-100'
	};

	type Props = Omit<ButtonProps, 'children' | 'variant' | 'size'> & {
		children: Snippet;
		icon: IconType;
		color: BannerColor;
		selected?: boolean;
		selectedTint?: boolean;
	};

	let {
		children,
		icon,
		color,
		selected = false,
		selectedTint = false,
		class: className,
		...rest
	}: Props = $props();
</script>

<Button
	{...rest}
	variant="ghost"
	size="sm"
	aria-pressed={selected}
	class={cn(
		'h-9 w-auto flex-none shrink-0 border border-transparent px-3 text-sm text-gray-700',
		selected &&
			!selectedTint &&
			'border-gray-300 bg-white font-semibold text-gray-950 shadow-xs hover:bg-white',
		selected && selectedTint && selectedTintColors[color],
		className
	)}
>
	<span class={iconColors[color]}>
		<Icon type={icon} size={IconSize.SMALL} />
	</span>
	<span>{@render children()}</span>
</Button>
