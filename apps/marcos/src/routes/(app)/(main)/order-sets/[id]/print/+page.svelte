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
</script>

<div class="flex flex-col gap-4"></div>
