<script lang="ts">
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import { SearchCustomerState } from '@/state/search/search-customer.state.svelte';
	import { CustomerApiGateway } from '@/gateway/customer-api.gateway';
	import type { Customer } from '@marcsimolduressonsardina/core/type';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const searchValue = SearchCustomerState.getSearchValue();
	let measuredCustomers: Promise<Customer[]>;

	onMount(() => {
		if (searchValue == null || searchValue.length === 0) {
			goto('/customers/search');
		}

		measuredCustomers = getGlobalProfiler().measure(
			CustomerApiGateway.searchCustomers(searchValue)
		);
	});
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.SEARCH}>
		Búsqueda de clientes - {searchValue}
	</SimpleHeading>
	{#if measuredCustomers}
		{#await measuredCustomers}
			<Box><ProgressBar text="Buscando clientes" /></Box>
		{:then customers}
			<div class="flex w-full flex-col gap-1 lg:grid lg:grid-cols-4">
				{#each customers as customer (customer.id)}
					<Button
						textType={ButtonText.GRAY}
						link={`/customers/${customer.id}`}
						text={customer.name}
						icon={IconType.USER}
						style={ButtonStyle.ORDER_GENERIC}
					></Button>
				{/each}
			</div>
			{#if customers.length === 0}
				<Box title="Sin Resultados" icon={IconType.USER}>
					<p class="text-md">No se han encontrado clientes</p>
				</Box>
			{/if}
		{/await}
	{/if}
</div>
