<script lang="ts">
	import type { PageData } from './$types';
	import { initPosthog } from '@/shared/fronted-analytics/posthog';
	import ExternalOrderPrint from '@/components/business-related/order-detail/ExternalOrderPrint.svelte';
	import { onMount } from 'svelte';
	import type { ExternalFullOrder } from '@marcsimolduressonsardina/core/type';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	initPosthog(data.envName, data.user);
	let fullOrder = $state<ExternalFullOrder | undefined>(undefined);
	let notFound = $state(false);

	// Helper function to get a specific cookie by name
	function getCookie(name: string): string | undefined {
		if (!browser) return undefined;

		const cookies = document.cookie.split(';');
		for (let cookie of cookies) {
			const [cookieName, cookieValue] = cookie.trim().split('=');
			if (cookieName === name) {
				return cookieValue;
			}
		}
		return undefined;
	}

	onMount(() => {
		if (browser) {
			const orderId = page.params.id;
			const cookieName = `order-${orderId}`;
			const orderString = getCookie(cookieName);

			if (orderString) {
				try {
					const parsedOrder = JSON.parse(decodeURIComponent(orderString));
					fullOrder = OrderRepresentationUtilities.hydrateFullOrder(
						parsedOrder
					) as ExternalFullOrder;
				} catch (error) {
					console.error('Error parsing order from cookie:', error);
					notFound = true;
				}
			} else {
				notFound = true;
			}
		}
	});
</script>

{#if fullOrder}
	<div class="w-full px-1 py-3">
		<div class="flex justify-center">
			<div class="w-fit">
				<ExternalOrderPrint {fullOrder} print></ExternalOrderPrint>
			</div>
		</div>
	</div>
{:else if notFound}
	<div>No se encontró el pedido</div>
{:else}
	<div>Cargando...</div>
{/if}
