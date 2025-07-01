import { PriceApiGateway } from '@/gateway/price-api.gateway';
import type { PreCalculatedItemPartRequest } from '@/type/api.type';
import {
	PricingType,
	type CalculatedItemPart,
	type ListPriceWithMold,
	type OrderDimensions,
	type PreCalculatedItemPart
} from '@marcsimolduressonsardina/core/type';
import {
	CalculatedItemUtilities,
	fabricDefaultPricing,
	fabricIds,
	PricingUtilites
} from '@marcsimolduressonsardina/core/util';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

export type OrderItem = {
	pre: PreCalculatedItemPart;
	post: CalculatedItemPart;
};

export class OrderFormItemsState {
	private items: Map<string, OrderItem>;
	private sortedItems: OrderItem[];
	private itemsWithDiscountNotAllowedPresent: boolean;
	private otherItems: Set<CalculatedItemPart>;
	private fabricPrices: ListPriceWithMold[];
	private orderDimensions: OrderDimensions;
	private markup?: number;

	constructor() {
		this.items = new SvelteMap();
		this.otherItems = new SvelteSet();
		this.markup = $state(undefined);
		this.orderDimensions = $state({
			originalHeight: 0,
			originalWidth: 0,
			totalHeight: 0,
			totalWidth: 0,
			workingHeight: 0,
			workingWidth: 0
		});
		this.fabricPrices = $derived(
			this.calculateFabricPrices(this.orderDimensions, this.getOrderItemsByType(PricingType.MOLD))
		);

		this.sortedItems = $derived(
			CalculatedItemUtilities.sortByPricingType(Array.from(this.items.values()), ['pre', 'type'])
		);

		this.itemsWithDiscountNotAllowedPresent = $derived(
			this.items.values().some((item) => !item.post.discountAllowed)
		);
	}

	public async setInitialParts(
		parts: PreCalculatedItemPart[],
		errorCallback: (id: string, errorMessage?: string) => void
	) {
		this.items.clear();
		await this.addParts(parts, errorCallback);
	}

	public async setInitialOtherItems(parts: CalculatedItemPart[]) {
		this.otherItems.clear();
		parts.forEach((part) => this.otherItems.add(part));
	}

	public async addOtherItem(part: CalculatedItemPart) {
		this.otherItems.add(part);
	}

	public async removeOtherItem(part: CalculatedItemPart) {
		this.otherItems.delete(part);
	}

	public getOtherItems(): CalculatedItemPart[] {
		return Array.from(this.otherItems.values()).reverse();
	}

	public setOrderDimensions(orderDimensions: OrderDimensions) {
		this.orderDimensions = orderDimensions;
	}

	public setMarkup(markup: number | undefined) {
		this.markup = markup;
	}

	public async addParts(
		partsToAdd: PreCalculatedItemPart[],
		errorCallback: (id: string, errorMessage?: string) => void
	) {
		const partKeyMap = new Map<string, PreCalculatedItemPart>();

		partsToAdd.forEach((part) => {
			const key = this.generateKeyFromPart(part);
			part.quantity += this.items.get(key)?.pre.quantity ?? 0;
			partKeyMap.set(key, part);
		});

		const request: PreCalculatedItemPartRequest = {
			partsToCalculateWithKey: Array.from(partKeyMap.entries()).map(([key, part]) => ({
				key,
				part
			})),
			orderDimensions: this.orderDimensions,
			markup: this.markup
		};

		const calculateResponse = await PriceApiGateway.calculatePrices(request);

		calculateResponse.forEach((response) => {
			if (response.part != null) {
				this.items.set(response.key, {
					pre: partKeyMap.get(response.key)!,
					post: response.part
				});
			} else {
				errorCallback(partKeyMap.get(response.key)!.id, response.errorMessage);
			}
		});
	}

	public async updateAllOrderItems(errorCallback: (id: string, errorMessage?: string) => void) {
		const parts = this.items.values().map((orderItem) => orderItem.pre);
		this.setInitialParts(Array.from(parts), errorCallback);
	}

	public deletePart(part: PreCalculatedItemPart) {
		this.items.delete(this.generateKeyFromPart(part));
	}

	public getOrderItems(): OrderItem[] {
		return this.sortedItems;
	}

	public hasItemsWithDiscountNotAllowed(): boolean {
		return this.itemsWithDiscountNotAllowedPresent;
	}

	public getFabricPrices(): ListPriceWithMold[] {
		return this.fabricPrices;
	}

	public isEmpty(): boolean {
		return this.items.size === 0;
	}

	public getOrderItemsByType(type: PricingType | PricingType[]): OrderItem[] {
		if (Array.isArray(type)) {
			return Array.from(this.items.values()).filter((part) => type.includes(part.pre.type));
		} else {
			return Array.from(this.items.values()).filter((part) => part.pre.type === type);
		}
	}

	public typeIsAdded(type: PricingType | PricingType[]): boolean {
		if (Array.isArray(type)) {
			return this.items.values().some((part) => type.includes(part.pre.type));
		} else {
			return this.items.values().some((part) => part.pre.type === type);
		}
	}

	public getCalculatedPart(part: PreCalculatedItemPart): CalculatedItemPart {
		return this.items.get(this.generateKeyFromPart(part))!.post;
	}

	private generateKeyFromPart(part: PreCalculatedItemPart): string {
		return `${part.id}-${part.type}${part.moldId ? `-m-${part.moldId}` : ''}${part.extraInfo ? `-e-${part.extraInfo}` : ''}`;
	}

	private calculateFabricPrices(orderDimensions: OrderDimensions, moldItems: OrderItem[]) {
		const prices = [fabricDefaultPricing];
		moldItems.values().forEach((t) => {
			[fabricIds.long, fabricIds.short].forEach((id) => {
				prices.push(
					PricingUtilites.generateCrossbarPricing(
						id,
						0,
						t.post.description,
						PricingUtilites.getFabricCrossbarDimension(
							id,
							orderDimensions.totalHeight,
							orderDimensions.totalWidth
						),
						t.pre.id
					)
				);
			});
		});
		return prices;
	}
}
