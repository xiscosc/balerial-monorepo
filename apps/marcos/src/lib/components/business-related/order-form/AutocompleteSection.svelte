<script lang="ts">
	import Spacer from '@/components/business-related/order-form/Spacer.svelte';
	import { type ListPrice, type PricingType } from '@marcsimolduressonsardina/core/type';
	import { formulasStringMap } from '@/shared/mappings/pricing.mapping';
	import { ScrollArea } from '@/components/ui/scroll-area/index.js';
	import { Separator } from '@/components/ui/separator/index.js';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Label from '@/components/ui/label/label.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { PricingUtilites } from '@marcsimolduressonsardina/core/util';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { AutocompleteSectionStateClass } from '@/components/business-related/order-form/AutocompleteSection.state.svelte';

	let {
		sectionTitle,
		label,
		addValue,
		pricingType,
		prices,
		added
	}: {
		sectionTitle: string;
		label: string;
		addValue: (pricingType: PricingType, value?: string) => void;
		pricingType: PricingType;
		prices: ListPrice[];
		added: boolean;
	} = $props();

	function getSelectLabel(price: ListPrice) {
		if (price.description == null || price.description === '') {
			return `${price.id} (${PricingUtilites.getPriceString(price, formulasStringMap)})`;
		}
		return `${price.description} (${PricingUtilites.getPriceString(price, formulasStringMap)})`;
	}

	let autocompleteInput = $state('');
	const autocompleteState = new AutocompleteSectionStateClass(addValue, prices);

	$effect(() => {
		autocompleteState.setIsAdded(added);
	});
</script>

<Spacer title={sectionTitle} />
<div class="flex flex-col gap-2 lg:col-span-2">
	<Label for="autocomplete-search">{label}:</Label>
	<Input
		id="autocomplete-search"
		bind:value={autocompleteInput}
		placeholder="Referencia... (mínimo 2 caracteres)"
		success={autocompleteState.isAdded()}
		oninput={() => autocompleteState.setAutocompleteInput(autocompleteInput)}
	/>
</div>
{#if autocompleteState.getAutocompleteInput().length >= 2}
	<ScrollArea class="h-72 rounded-md border lg:col-span-2">
		<div class="p-4">
			<h4 class="mb-4 text-sm font-medium leading-none">Búsqueda de marcos / molduras</h4>
			{#each autocompleteState.getFilteredPrices() as price (price.id)}
				<button
					class="flexr-row flex w-full items-center gap-2 rounded-md p-2 hover:bg-gray-50"
					onclick={() => {
						autocompleteState.add(pricingType, price.id);
						autocompleteInput = '';
						autocompleteState.setAutocompleteInput('');
					}}
					type="button"
				>
					<Icon type={IconType.ADD} />
					{getSelectLabel(price)}
				</button>
				<Separator class="my-2 last:hidden" />
			{/each}
			{#if autocompleteState.getFilteredPrices().length === 0}
				<div class="flex flex-row items-center gap-2 p-2">
					<Icon type={IconType.NOT_FOUND} />
					<span>No se encontraron resultados</span>
				</div>
			{/if}
		</div>
	</ScrollArea>
{/if}
