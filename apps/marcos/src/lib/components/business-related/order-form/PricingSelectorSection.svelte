<script lang="ts">
	import Spacer from '@/components/business-related/order-form/Spacer.svelte';
	import type { ListPriceWithMold, PricingType } from '@marcsimolduressonsardina/core/type';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import type { Snippet } from 'svelte';
	import * as NativeSelect from '@/components/ui/native-select/index.js';
	import { PricingSelectorSectionStateClass } from '@/components/business-related/order-form/PricingSelectorSection.state.svelte';

	interface Props {
		sectionTitle: string;
		label: string;
		addValue: (
			pricingType: PricingType,
			value?: string,
			moldId?: string,
			extraInfo?: string
		) => void;
		prices: ListPriceWithMold[];
		extraPrices?: ListPriceWithMold[];
		locationIdForExtraPrices?: string | undefined;
		showExtraInfo?: boolean;
		added: boolean;
		children?: Snippet;
	}

	let {
		sectionTitle,
		label,
		addValue,
		prices,
		extraPrices = [],
		locationIdForExtraPrices = undefined,
		showExtraInfo = false,
		added,
		children = undefined
	}: Props = $props();

	function getSelectLabel(price: ListPriceWithMold): string {
		return price.description ?? price.id;
	}

	let selectedId = $state<string | undefined>(undefined);
	let extraInfo = $state<string | undefined>(undefined);

	const selectorState = new PricingSelectorSectionStateClass(
		prices,
		locationIdForExtraPrices,
		showExtraInfo,
		addValue
	);

	$effect(() => {
		selectorState.setIsAdded(added);
		selectorState.setExtraPrices(extraPrices);
	});
</script>

<Spacer title={sectionTitle} />
<div class="lg:col-span-2">
	<div class="flex flex-col justify-center gap-3 lg:grid lg:grid-cols-2 lg:items-end">
		<div class="flex flex-col gap-2">
			<Label for="priceId">{label}:</Label>
			<NativeSelect.Root
				name="priceId"
				bind:value={selectedId}
				onchange={() => selectorState.setSelectedId(selectedId)}
				success={selectorState.isAdded()}
			>
				<option value=""></option>
				{#each selectorState.getOrderedPrices() as orderedPrice}
					<option value={orderedPrice.stateId} data-mold={orderedPrice.value.moldId}
						>{getSelectLabel(orderedPrice.value)}</option
					>
				{/each}
			</NativeSelect.Root>
		</div>

		{#if showExtraInfo}
			<div class="flex flex-col gap-2">
				<Label for="extraInfoValue">Número:</Label>
				<Input
					type="text"
					name="extraInfoValue"
					bind:value={extraInfo}
					oninput={() => selectorState.setExtraInfo(extraInfo)}
					success={selectorState.isAdded()}
				/>
			</div>
			{@render children?.()}
			<div class="w-full lg:col-span-2 lg:w-auto">
				<Button
					icon={IconType.PLUS}
					iconSize={IconSize.BIG}
					disabled={!selectorState.getCanBeAdded()}
					tooltipText={selectorState.getTooltipText()}
					text="Añadir a la lista"
					onClick={() => selectorState.add()}
				></Button>
			</div>
		{:else}
			{@render children?.()}
			<div class="w-full lg:w-auto">
				<Button
					icon={IconType.PLUS}
					iconSize={IconSize.BIG}
					disabled={!selectorState.getCanBeAdded()}
					tooltipText={selectorState.getTooltipText()}
					text="Añadir a la lista"
					onClick={() => selectorState.add()}
				></Button>
			</div>
		{/if}
	</div>
</div>
