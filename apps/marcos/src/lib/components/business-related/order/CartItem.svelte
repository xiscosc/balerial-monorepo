<script lang="ts" generics="T">
	import type { CalculatedItemPart } from '@marcsimolduressonsardina/core/type';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Step from '@/components/generic/Step.svelte';

	interface Props<T> {
		part: CalculatedItemPart;
		partToDelete?: T;
		deleteExtraPart?: (partToDelete: T) => void;
		hideDeleteButton?: boolean;
		showNoDiscountAllowed?: boolean;
		showPrice?: boolean;
	}

	let {
		part,
		partToDelete = undefined,
		deleteExtraPart = undefined,
		hideDeleteButton = false,
		showNoDiscountAllowed = false,
		showPrice = true
	}: Props<T> = $props();

	let noDiscountAllowed = $derived(!part.discountAllowed && showNoDiscountAllowed);
</script>

<Step
	icon={IconType.CART}
	title="{part.description}{noDiscountAllowed ? '*' : ''} {part.floating ? '(Flot)' : ''}"
	subtitle={showPrice ? (part.price * part.quantity).toFixed(2) + ' €' : 'Pendiente de calcular'}
	quantity={part.quantity}
	deleteFunction={() => partToDelete !== undefined && deleteExtraPart?.(partToDelete)}
	showDelete={!hideDeleteButton}
/>
