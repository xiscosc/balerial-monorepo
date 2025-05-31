<script lang="ts">
	import Spacer from '@/components/business-related/order-form/Spacer.svelte';
	import type { ListPrice } from '@marcsimolduressonsardina/core/type';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Label from '@/components/ui/label/label.svelte';
	import * as NativeSelect from '@/components/ui/native-select/index.js';
	import { PricingSelectorWithQuantitySectionStateClass } from '@/components/business-related/order-form/PricingSelectorWithQuantitySection.state.svelte';
	import { GenericTools } from '@/shared/generic/generic.tools';

	let {
		added,
		sectionTitle,
		label,
		prices,
		addItem
	}: {
		added: boolean;
		sectionTitle: string;
		label: string;
		prices: ListPrice[];
		addItem: (id: string, quantity: number) => void;
	} = $props();

	const selectorState = new PricingSelectorWithQuantitySectionStateClass(addItem);

	$effect(() => {
		selectorState.setIsAdded(added);
	});

	let selectedId: string | undefined = $state();
	let selectedQuantity: string = $state('1');
</script>

<Spacer title={sectionTitle} />

<div class="flex flex-col gap-2 lg:col-span-2">
	<div class="flex flex-col gap-2 lg:flex-row">
		<div class="flex flex-1 flex-col gap-2">
			<Label for="predefinedElements">{label}:</Label>
			<NativeSelect.Root
				name="predefinedElements"
				bind:value={selectedId}
				success={selectorState.isAdded()}
			>
				<option></option>
				{#each prices.sort((a, b) => b.priority - a.priority) as otherPrice (otherPrice.id)}
					<option value={otherPrice.id}
						>{otherPrice.description} ({otherPrice.price.toFixed(2)} €)</option
					>
				{/each}
			</NativeSelect.Root>
		</div>

		<div class="flex flex-1 flex-col gap-2">
			<Label for="predefinedQuantityElements">Cantidad:</Label>
			<NativeSelect.Root name="predefinedQuantityElements" bind:value={selectedQuantity}>
				{#each GenericTools.getIterableStringList(10, 1) as num (num)}
					<option value={num}>{num}</option>
				{/each}
			</NativeSelect.Root>
		</div>
	</div>
	<div class="lg:col-span-2">
		<Button
			text="Añadir a la lista"
			onClick={() => {
				if (selectorState.add(selectedId, selectedQuantity)) {
					selectedQuantity = '1';
				}
			}}
			icon={IconType.PLUS}
			iconSize={IconSize.BIG}
		></Button>
	</div>
</div>
