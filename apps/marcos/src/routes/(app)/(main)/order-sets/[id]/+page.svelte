<script lang="ts">
	import type { PageData } from './$types';

	import { IconType } from '@/components/generic/icon/icon.enum';
	import OrderList from '@/components/business-related/order-list/OrderList.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import type { FullOrder } from '@marcsimolduressonsardina/core/type';
	import Button from '@/components/generic/button/Button.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const ordersPromise: Promise<FullOrder[]> = new Promise((resolve) => {
		const orders: FullOrder[] = [];
		if (data.orderSet == null) {
			resolve(orders);
		} else {
			resolve(Object.values(data.orderSet.orders));
		}
	});
	let measuredOrders = $derived(getGlobalProfiler().measure(ordersPromise));

	async function handlePrint() {
		await goto(resolve('/(app)/(main)/order-sets/[id]/print', { id: data.orderSet!.id }));
	}
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.LIST}>Listado de pedidos</SimpleHeading>
	{#if data.orderSet != null && Object.values(data.orderSet.orders).length > 0}
		<div class="flex w-full flex-col place-content-center items-center justify-center gap-2">
			<Button text="Imprimir" icon={IconType.PRINTER} onClick={handlePrint}></Button>
		</div>
	{/if}
	<OrderList promiseOrders={measuredOrders} />
</div>
