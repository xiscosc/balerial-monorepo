import type { Snippet } from 'svelte';
import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
import { IconSize, type IconType } from '@/components/generic/icon/icon.enum';
import { type ClassValue } from 'svelte/elements';

export interface IMarcosButtonProps {
	children?: Snippet;
	variant?: ButtonStyle;
	textVariant?: ButtonText;
	size?: ButtonType;
	icon?: IconType;
	iconSize?: IconSize;
	class?: ClassValue | undefined | null;
}
