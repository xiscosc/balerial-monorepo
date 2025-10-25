import type { ListPriceWithMold, PricingType } from '@marcsimolduressonsardina/core/type';
import { SvelteMap } from 'svelte/reactivity';

interface PricingSelectorSectionState {
	isAdded: () => boolean;
	setIsAdded: (value: boolean) => void;
	setSelectedId: (id: string | undefined) => void;
	setExtraPrices: (extraPrices: ListPriceWithMold[]) => void;
	setExtraInfo: (extraInfo: string | undefined) => void;
	getCanBeAdded: () => boolean;
	getOrderedPrices: () => { stateId: string; value: ListPriceWithMold }[];
	getTooltipText: () => string | undefined;
	add: () => boolean;
}

export class PricingSelectorSectionStateClass implements PricingSelectorSectionState {
	private added: boolean = $state(false);
	private selectedId: string | undefined = $state(undefined);
	private extraInfo: string | undefined = $state(undefined);
	private prices: ListPriceWithMold[] = $state([]);
	private extraPrices: ListPriceWithMold[] = $state([]);
	private locationIdForExtraPrices: string | undefined = $state(undefined);
	private extraInfoRequired: boolean = $state(false);
	private pricesMap: Map<string, ListPriceWithMold> = $derived(
		this.generateMap(this.prices, this.extraPrices)
	);
	private orderedPrices: { stateId: string; value: ListPriceWithMold }[] = $derived(
		this.generateOrderedPrices(this.prices, this.extraPrices, this.locationIdForExtraPrices)
	);
	private canBeAdded: boolean = $derived(
		this.selectedId != null &&
			this.selectedId.length > 0 &&
			(!this.extraInfoRequired ||
				(this.extraInfoRequired && this.extraInfo != null && this.extraInfo.length > 0))
	);
	private tooltipText: string | undefined = $derived(
		this.canBeAdded ? undefined : this.selectedId != null ? 'Falta número' : 'Seleccione elemento'
	);

	constructor(
		prices: ListPriceWithMold[],
		locationIdForExtraPrices: string | undefined,
		extraInfoRequired: boolean,
		private addcCallback: (
			pricingType: PricingType,
			value?: string,
			moldId?: string,
			extraInfo?: string
		) => void
	) {
		this.extraInfoRequired = extraInfoRequired;
		this.prices = prices;
		this.locationIdForExtraPrices = locationIdForExtraPrices;
	}

	public getCanBeAdded() {
		return this.canBeAdded;
	}

	public setExtraPrices(extraPrices: ListPriceWithMold[]) {
		this.extraPrices = extraPrices;
	}

	public getTooltipText() {
		return this.tooltipText;
	}

	public setSelectedId(id: string | undefined) {
		this.selectedId = id;
	}

	public getOrderedPrices() {
		return this.orderedPrices;
	}

	public isAdded() {
		return this.added;
	}

	public setIsAdded(value: boolean) {
		this.added = value;
	}

	public add(): boolean {
		if (this.selectedId == null || (this.extraInfoRequired && this.extraInfo == null)) {
			return false;
		}

		const selectedPrice = this.pricesMap.get(this.selectedId);
		if (selectedPrice == null) {
			return false;
		}

		this.addcCallback(selectedPrice.type, selectedPrice.id, selectedPrice.moldId, this.extraInfo);
		return true;
	}

	public setExtraInfo(extraInfo: string | undefined) {
		this.extraInfo = extraInfo;
	}

	private getId(p: ListPriceWithMold): string {
		return `${p.id}${p.moldId ? '_' + p.moldId : ''}`;
	}

	private insertElementsBeforeKey<T extends { id: string }>(
		originalArray: T[],
		newArray: T[],
		key: string
	): T[] {
		const keyIndex = originalArray.findIndex((p) => p.id === key);
		if (keyIndex === -1) {
			return [...originalArray, ...newArray];
		}

		return [...originalArray.slice(0, keyIndex), ...newArray, ...originalArray.slice(keyIndex)];
	}

	private generateMap(
		prices: ListPriceWithMold[],
		extraPrices: ListPriceWithMold[]
	): Map<string, ListPriceWithMold> {
		const map = new SvelteMap<string, ListPriceWithMold>();
		prices.forEach((p) => map.set(this.getId(p), p));
		extraPrices.forEach((p) => map.set(this.getId(p), p));
		return map;
	}

	private generateOrderedPrices(
		prices: ListPriceWithMold[],
		extraPrices: ListPriceWithMold[],
		locationIdForExtraPrices: string | undefined
	): { stateId: string; value: ListPriceWithMold }[] {
		const locationIdForExtraPricesFound =
			locationIdForExtraPrices != null &&
			prices.findIndex((p) => p.id === locationIdForExtraPrices) > -1;

		const pricesWithPriority = prices
			.filter((p) => p.priority > 0)
			.sort((a, b) => b.priority - a.priority);
		const extraPricesWithPriority = extraPrices.filter((p) => p.priority > 0);
		const pricesWithoutPriority = prices.filter((p) => p.priority === 0);
		const extraPricesWithoutPriority = extraPrices.filter((p) => p.priority === 0);

		let result = [];
		if (!locationIdForExtraPricesFound) {
			const allPriorityPrices = [...pricesWithPriority, ...extraPricesWithPriority].sort(
				(a, b) => b.priority - a.priority
			);
			result = [...allPriorityPrices, ...pricesWithoutPriority, ...extraPricesWithoutPriority];
		} else {
			result = [
				...this.insertElementsBeforeKey(
					pricesWithPriority,
					extraPricesWithPriority,
					locationIdForExtraPrices
				),
				...this.insertElementsBeforeKey(
					pricesWithoutPriority,
					extraPricesWithoutPriority,
					locationIdForExtraPrices
				)
			];
		}

		return result.map((p) => ({ stateId: this.getId(p), value: p }));
	}
}
