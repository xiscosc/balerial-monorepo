<script lang="ts">
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import { superForm } from 'sveltekit-superforms';
	import Box from '@/components/generic/Box.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum.js';
	import { IconType } from '@/components/generic/icon/icon.enum.js';
	import Input from '@/components/ui/input/input.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { SearchCustomerState } from '@/state/search/search-customer.state.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';

	let { data } = $props();
	const { form, enhance, submitting } = superForm(data.form);

	let searchQuery = $state('');

	function triggerSearch() {
		SearchCustomerState.setSearchValue(searchQuery);
		goto(resolve(`/(app)/(main)/customers/search-list`));
	}
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.USER}>Clientes</SimpleHeading>
	<div class="flex flex-col gap-2">
		<Box title="Buscar cliente por teléfono">
			{#if $submitting}
				<ProgressBar />
			{:else}
				<form use:enhance class="flex flex-col gap-2" method="post">
					<div>
						<label class="block text-sm font-medium text-gray-700" for="phone">Teléfono:</label>
						<Input bind:value={$form.phone} id="phone" type="tel" name="phone" />
					</div>

					<MarcosButton icon={IconType.SEARCH} type="submit" variant={ButtonStyle.CUSTOMER}>
						Buscar
					</MarcosButton>
				</form>
			{/if}
		</Box>

		<Box title="Buscar cliente por nombre">
			<div class="flex flex-col gap-2">
				<div>
					<label class="block text-sm font-medium text-gray-700" for="phone">Nombre:</label>
					<Input bind:value={searchQuery} id="name" required type="text" name="name" />
				</div>

				<MarcosButton
					icon={IconType.SEARCH}
					disabled={searchQuery.length < 3}
					onclick={triggerSearch}
					variant={ButtonStyle.CUSTOMER}
				>
					Buscar
				</MarcosButton>
			</div>
		</Box>

		<Box title="Gestión">
			<div class="flex flex-col gap-2 md:flex-row">
				{#if data.canSeeList}
					<MarcosButton
						icon={IconType.USER}
						textVariant={ButtonText.GRAY}
						onclick={() => goto(resolve('/(app)/(main)/customers/list'))}
						variant={ButtonStyle.ORDER_GENERIC}
					>
						Ver listado
					</MarcosButton>
				{/if}

				<MarcosButton
					onclick={() => goto(resolve('/(app)/(main)/customers/new'))}
					icon={IconType.USER_PLUS}
					variant={ButtonStyle.NEUTRAL}
				>
					Crear cliente
				</MarcosButton>
			</div>
		</Box>
	</div>
</div>
