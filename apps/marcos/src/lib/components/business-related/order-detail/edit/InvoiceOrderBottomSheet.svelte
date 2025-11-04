<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { type FullOrder } from '@marcsimolduressonsardina/core/type';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';

	interface Props {
		fullOrder: FullOrder;
	}

	let { fullOrder }: Props = $props();
	const order = fullOrder.order;

	let loading = $state(false);
</script>

<BottomSheet
	title="Gestionar factura pedido"
	description="Cambiar el estado de facturación del pedido"
	iconType={IconType.INVOICED}
>
	{#snippet trigger({ props }: { props: Record<string, unknown> })}
		{#if order.invoiced}
			<MarcosButton
				{...props}
				icon={IconType.INVOICED}
				textVariant={ButtonText.NO_COLOR}
				variant={ButtonStyle.ORDER_PICKED_UP_VARIANT}
			>
				Facturado
			</MarcosButton>
		{:else}
			<MarcosButton
				{...props}
				icon={IconType.NOT_INVOICED}
				textVariant={ButtonText.NO_COLOR}
				variant={ButtonStyle.DELETE_VARIANT}
			>
				No Facturado
			</MarcosButton>
		{/if}
	{/snippet}

	{#snippet action()}
		<div class="flex flex-col gap-2">
			{#if loading}
				<BottomSheetLoading />
			{:else if order.invoiced}
				<form
					method="post"
					class="flex flex-col gap-2"
					action={`?/${OrderActionNames.SET_NOT_INVOICED}`}
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<MarcosButton
						icon={IconType.NOT_INVOICED}
						textVariant={ButtonText.NO_COLOR}
						variant={ButtonStyle.DELETE_VARIANT}
						type="submit"
					>
						Marcar como no facturado
					</MarcosButton>
				</form>
			{:else}
				<form
					method="post"
					class="flex flex-col gap-2"
					action={`?/${OrderActionNames.SET_INVOICED}`}
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<MarcosButton
						icon={IconType.INVOICED}
						textVariant={ButtonText.NO_COLOR}
						variant={ButtonStyle.ORDER_PICKED_UP_VARIANT}
						type="submit"
					>
						Marcar como facturado
					</MarcosButton>
				</form>
			{/if}
		</div>
	{/snippet}
</BottomSheet>
