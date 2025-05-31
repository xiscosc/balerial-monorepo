import { PUBLIC_DOMAIN_URL } from '$env/static/public';

import {
	OrderStatus,
	PricingType,
	type CalculatedItem,
	type ExternalFullOrder,
	type ExternalOrder,
	type FullOrder,
	type Order
} from '@marcsimolduressonsardina/core/type';
import { CalculatedItemUtilities, otherExtraId } from '@marcsimolduressonsardina/core/util';
import { customerMoldIds, discountMap } from '../mappings/order.mapping';

export class OrderRepresentationUtilities {
	private static bullCharacter = '\u2022';

	public static getOrderMolds(order: Order | ExternalOrder): string[] {
		return order.item.partsToCalculate
			.filter((p) => p.type === PricingType.MOLD)
			.map(
				(p) =>
					`${CalculatedItemUtilities.getMoldDescription(p.id)} ${p.quantity > 1 ? 'x' + p.quantity : ''}`
			);
	}

	public static getOrderElementByPricingType(
		order: Order | ExternalOrder,
		calculatedItem: CalculatedItem,
		pricingType: PricingType
	): string[] {
		const ids = order.item.partsToCalculate.filter((p) => p.type === pricingType).map((p) => p.id);

		return calculatedItem.parts
			.filter((p) => ids.indexOf(p.priceId) > -1)
			.map((p) => `${p.description} ${p.quantity > 1 ? 'x' + p.quantity : ''}`);
	}

	public static getExtras(calculatedItem: CalculatedItem): string[] {
		return calculatedItem.parts.filter((p) => p.priceId === otherExtraId).map((p) => p.description);
	}

	public static getWorkingDimensions(order: Order | ExternalOrder): string {
		const item = order.item;
		const { totalWidth, totalHeight } = CalculatedItemUtilities.getTotalDimensions(
			item.width,
			item.height,
			item.pp,
			item.ppDimensions
		);

		return `${this.formatNumber(totalHeight)}x${this.formatNumber(totalWidth)} cm`;
	}

	public static getFirstMoldDescriptionFromOrder(
		order: Order,
		calculatedItem: CalculatedItem
	): string | undefined {
		const ids = order.item.partsToCalculate
			.filter((p) => p.type === PricingType.MOLD)
			.filter((p) => !customerMoldIds.includes(p.id))
			.map((p) => p.id);

		if (ids.length === 0) {
			return undefined;
		}

		const molds = calculatedItem.parts
			.filter((p) => ids.indexOf(p.priceId) > -1)
			.map((p) => p.description);

		return molds.length === 0 ? undefined : molds[0];
	}

	public static getOrderPublicUrl(order: Order): string {
		return `${PUBLIC_DOMAIN_URL}/s/${order.shortId}`;
	}

	public static getWhatsappTicketText(order: Order): string {
		const url = this.getOrderPublicUrl(order);
		return `Su pedido \`\`\`${order.publicId}\`\`\` ha sido registrado correctamente, puede consultar aquí su resguardo ${url} . Marcs i Moldures Son Sardina.`;
	}

	public static getWhatsappQuoteText(order: Order): string {
		const url = this.getOrderPublicUrl(order);
		return `Aquí tiene una copia de su presupuesto \`\`\`${order.publicId}\`\`\` :  ${url} . Marcs i Moldures Son Sardina.`;
	}

	public static getWhatsappFinishedText(orders: Order[]): string {
		const greeting =
			'Nuestro horario es de lunes a viernes de 09:00 a 18:00 y los sábados de 09:30 a 13:15. Marcs i Moldures Son Sardina.';
		if (orders.length === 1) {
			const url = this.getOrderPublicUrl(orders[0]);
			return `Hemos terminado su pedido \`\`\`${orders[0].publicId}\`\`\` puede pasar a buscarlo. Aquí tiene el resguardo ${url} . ${greeting}`;
		} else {
			const orderLines = orders
				.map((order) => `* \`\`\`${order.publicId}\`\`\` \n ${this.getOrderPublicUrl(order)}`)
				.join('\n');

			return `\n Hemos terminado sus pedidos:\n${orderLines}\nPuede pasar a buscarlos. ${greeting}`;
		}
	}

	public static getDiscountRepresentation(discount: number): string {
		const discountMapReverse: Record<number, string> = Object.entries(discountMap).reduce(
			(acc, [key, value]) => ({ ...acc, [value]: key }),
			{}
		);

		const discountKey = discountMapReverse[discount];
		if (discountKey) {
			return discountKey;
		}

		return `${discount}%`;
	}

	public static getPossibleNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
		switch (currentStatus) {
			case OrderStatus.PENDING:
				return [OrderStatus.FINISHED, OrderStatus.PICKED_UP];
			case OrderStatus.FINISHED:
				return [OrderStatus.PICKED_UP, OrderStatus.PENDING];
			case OrderStatus.PICKED_UP:
				return [OrderStatus.FINISHED, OrderStatus.PENDING];
			default:
				return [currentStatus];
		}
	}

	public static hydrateFullOrderDates(fullOrders: FullOrder[]): FullOrder[] {
		return fullOrders.map((fo) => this.hydrateFullOrder(fo) as FullOrder);
	}

	public static hydrateFullOrder(
		fullOrder: FullOrder | ExternalFullOrder
	): FullOrder | ExternalFullOrder {
		return {
			...fullOrder,
			order: {
				...fullOrder.order,
				item: {
					...fullOrder.order.item,
					deliveryDate: new Date(fullOrder.order.item.deliveryDate)
				},
				createdAt: new Date(fullOrder.order.createdAt)
			}
		} as FullOrder | ExternalFullOrder;
	}

	public static groupInPairs(arr: string[]): string[][] {
		const result: string[][] = [];

		for (let i = 0; i < arr.length; i += 2) {
			const pair: string[] = [arr[i], arr[i + 1] || ''];
			result.push(pair);
		}

		return result;
	}

	public static getPrintableListRepresentatiom(element: string): string {
		if (element.length > 0) {
			return `${this.bullCharacter} ${element}`;
		}

		return '';
	}

	private static formatNumber(num: number): string | number {
		// Check if the number has decimals
		if (num % 1 !== 0) {
			// If it has decimals, format it to one decimal place
			return num.toFixed(1);
		}

		// If no decimals, return the number as it is
		return num;
	}
}
