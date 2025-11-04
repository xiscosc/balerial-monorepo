<script lang="ts">
	import type { Customer } from '@marcsimolduressonsardina/core/type';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { trackEvent } from '@/shared/fronted-analytics/posthog';
	import { resolve } from '$app/paths';

	interface Props {
		customer: Customer;
		showDelete?: boolean;
		totalOrders?: number;
		allowCol?: boolean;
	}

	let formLoading = $state(false);
	let { customer, showDelete = false, totalOrders = 0, allowCol = false }: Props = $props();
</script>

<div class="flex w-full flex-col gap-3">
	<div
		class="flex w-full flex-row items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
	>
		<div class="flex flex-row items-center justify-start gap-2">
			<div class="rounded-full border border-gray-100 bg-white p-2 text-gray-900">
				<Icon type={IconType.USER} size={IconSize.BIG} />
			</div>

			<div>
				<p class="text-md font-medium">{customer.name}</p>
				<p class="text-sm">{customer.phone}</p>
			</div>
		</div>

		<div class="flex" class:md:hidden={allowCol}>
			<MarcosButton
				onclick={() => goto(resolve(`/customers/${customer.id}/edit`))}
				icon={IconType.EDIT}
				variant={ButtonStyle.SOFT_DELETE}
				size={ButtonType.SMALL}
				textVariant={ButtonText.GRAY}
			></MarcosButton>
		</div>

		<div class="hidden" class:md:flex={allowCol}>
			<MarcosButton
				onclick={() => goto(resolve(`/customers/${customer.id}/edit`))}
				icon={IconType.EDIT}
				variant={ButtonStyle.SOFT_DELETE}
				size={ButtonType.SMALL}
				textVariant={ButtonText.GRAY}
			>
				Editar
			</MarcosButton>
		</div>
	</div>

	<div class="flex flex-col gap-2" class:lg:flex-row={allowCol}>
		<MarcosButton
			icon={IconType.FORM}
			onclick={() => goto(resolve(`/customers/${customer.id}/orders/new`))}
			variant={ButtonStyle.FORM}
		>
			Crear nota
		</MarcosButton>

		<MarcosButton
			textVariant={ButtonText.GRAY}
			icon={IconType.ORDER_DEFAULT}
			onclick={() => goto(resolve(`/customers/${customer.id}/orders`))}
			variant={ButtonStyle.ORDER_GENERIC}
		>
			Ver pedidos
		</MarcosButton>

		<MarcosButton
			icon={IconType.ORDER_QUOTE}
			onclick={() => goto(resolve(`/customers/${customer.id}/orders?quotes=true`))}
			variant={ButtonStyle.ORDER_QUOTE}
		>
			Ver presupuestos
		</MarcosButton>

		<div class="flex md:hidden">
			<MarcosButton
				icon={IconType.PHONE}
				onclick={() => {
					trackEvent('Customer called', { customerId: customer.id });
					window.location.href = `tel:${customer.phone}`;
				}}
			>
				Llamar
			</MarcosButton>
		</div>

		<WhatsAppButton label="Enviar Whatsapp" message="" {customer}></WhatsAppButton>

		{#if showDelete}
			<BottomSheet
				title="Eliminar cliente"
				description="Esta acción no se puede deshacer"
				iconType={IconType.TRASH}
			>
				{#snippet trigger({ props }: { props: Record<string, unknown> })}
					<MarcosButton
						{...props}
						disabled={totalOrders > 0}
						icon={IconType.TRASH}
						variant={ButtonStyle.DELETE}
					>
						Eliminar cliente
					</MarcosButton>
				{/snippet}

				{#snippet action()}
					{#if totalOrders > 0}
						El cliente tiene pedidos o presupuestos, no se puede eliminar.
					{:else}
						<form
							class="w-full text-center"
							method="post"
							action="?/deleteCustomer"
							use:enhance={() => {
								formLoading = true;
								return async ({ update }) => {
									await update();
									formLoading = false;
								};
							}}
						>
							{#if formLoading}
								<BottomSheetLoading />
							{:else}
								<MarcosButton icon={IconType.TRASH} variant={ButtonStyle.DELETE} type="submit">
									Confirmar
								</MarcosButton>
							{/if}
						</form>
					{/if}
				{/snippet}
			</BottomSheet>
		{/if}
	</div>
</div>
