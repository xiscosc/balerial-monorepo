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
	import OrderSetPrint from '@/components/business-related/order-set/OrderSetPrint.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let measuredOrderSet = $derived(getGlobalProfiler().measure(data.orderSet));
</script>

{#await measuredOrderSet}
	cargando
{:then orderSet}
	{#if orderSet}
		<OrderSetPrint {orderSet}></OrderSetPrint>
	{:else}
		error
	{/if}
{/await}
