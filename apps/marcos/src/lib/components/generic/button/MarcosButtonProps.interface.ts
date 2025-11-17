import type { Snippet } from 'svelte';
import {
	ButtonVariant,
	ButtonTextVariant,
	ButtonSize
} from '@/components/generic/button/button.enum';
import { IconSize, type IconType } from '@/components/generic/icon/icon.enum';
import { type ClassValue } from 'svelte/elements';

export interface IMarcosButtonProps {
	children?: Snippet;
	variant?: ButtonVariant;
	textVariant?: ButtonTextVariant;
	size?: ButtonSize;
	icon?: IconType;
	iconSize?: IconSize;
	class?: ClassValue | undefined | null;
}
