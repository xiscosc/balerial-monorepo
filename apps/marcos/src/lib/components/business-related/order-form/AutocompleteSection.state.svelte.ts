import Fuse from 'fuse.js';
import type { ListPrice, PricingType } from '@marcsimolduressonsardina/core/type';

interface AutocompleteSectionState {
	isAdded: () => boolean;
	setIsAdded: (value: boolean) => void;
	getAutocompleteInput: () => string;
	setAutocompleteInput: (value: string) => void;
	getFilteredPrices: () => ListPrice[];
	add: (pricingType: PricingType, id?: string) => void;
}

export class AutocompleteSectionStateClass implements AutocompleteSectionState {
	private added: boolean = $state(false);
	private autocompleteInput: string = $state('');
	private fuse: Fuse<ListPrice> | null = new Fuse([], {
		keys: ['id', 'description'],
		isCaseSensitive: false,
		threshold: 0.1
	});
	private filteredPrices: ListPrice[] = $derived(
		this.fuse?.search(this.autocompleteInput).map((result) => result.item) ?? []
	);

	constructor(
		private addCallback: (pricingType: PricingType, value?: string) => void,
		prices: ListPrice[]
	) {
		this.fuse?.setCollection(prices);
	}

	public isAdded() {
		return this.added;
	}

	public setIsAdded(value: boolean) {
		this.added = value;
	}

	public getAutocompleteInput() {
		return this.autocompleteInput;
	}

	public setAutocompleteInput(value: string) {
		this.autocompleteInput = value;
	}

	public getFilteredPrices() {
		return this.filteredPrices;
	}

	public add(pricingType: PricingType, id?: string) {
		this.addCallback(pricingType, id);
	}

	public destroy() {
		this.fuse?.setCollection([]);
		this.fuse = null;
	}
}
