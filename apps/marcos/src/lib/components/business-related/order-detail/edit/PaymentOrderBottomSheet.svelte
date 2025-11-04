<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { PaymentStatus, type FullOrder } from '@marcsimolduressonsardina/core/type';
	import Divider from '@/components/generic/Divider.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Input from '@/components/ui/input/input.svelte';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';

	interface Props {
		fullOrder: FullOrder;
	}

	let { fullOrder }: Props = $props();
	const order = fullOrder.order;
	const totals = fullOrder.totals;

	let loading = $state(false);
</script>

<BottomSheet
	title="Gestionar pago"
	description="Seleccione el nuevo estado del pago para el pedido"
	iconType={IconType.COINS}
>
	{#snippet trigger({ props }: { props: Record<string, unknown> })}
		{#if totals.payed}
			<MarcosButton
				{...props}
				icon={IconType.DONE}
				textVariant={ButtonText.NO_COLOR}
				variant={ButtonStyle.ORDER_PICKED_UP_VARIANT}
			>
				Pagado
			</MarcosButton>
		{:else if order.amountPayed === 0}
			<MarcosButton
				{...props}
				icon={IconType.NOT_DONE}
				textVariant={ButtonText.NO_COLOR}
				variant={ButtonStyle.DELETE_VARIANT}
			>
				Pendiente de pago
			</MarcosButton>
		{:else}
			<MarcosButton
				{...props}
				icon={IconType.NOT_DONE}
				textVariant={ButtonText.NO_COLOR}
				variant={ButtonStyle.DELETE_VARIANT}
			>
				Parcialmente pagado
			</MarcosButton>
		{/if}
	{/snippet}

	{#snippet action()}
		<div class="flex flex-col gap-2">
			{#if loading}
				<BottomSheetLoading />
			{:else}
				<div
					class="flex flex-col items-center justify-center rounded-lg border-2 border-dotted border-gray-800 p-2 text-gray-800"
				>
					{#if totals.total === 0}
						<span class="text-lg font-bold"> Pago no necesario </span>
					{:else if order.amountPayed > 0 && !totals.payed}
						<span class="text-md line-through">{totals.total.toFixed(2)} €</span>
						<span class="text-md">{order.amountPayed.toFixed(2)} € pagado</span>
						<span class="text-lg font-bold">
							{totals.remainingAmount.toFixed(2)} € pendiente
						</span>
					{:else}
						<span class="text-lg font-bold">
							{totals.total.toFixed(2)} € {order.amountPayed !== totals.total
								? 'pendiente'
								: 'pagado'}
						</span>
					{/if}
				</div>
				{#if totals.total !== 0}
					<Divider></Divider>

					{#if !totals.payed}
						<form
							method="post"
							action={`?/${OrderActionNames.CHANGE_PAYMENT}`}
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
							<input type="hidden" name="paymentStatus" value={PaymentStatus.FULLY_PAID} />
							<MarcosButton
								icon={IconType.DONE}
								textVariant={ButtonText.NO_COLOR}
								variant={ButtonStyle.ORDER_PICKED_UP_VARIANT}
								type="submit"
							>
								Pagado
							</MarcosButton>
						</form>
					{/if}

					{#if order.amountPayed !== 0}
						<form
							method="post"
							action={`?/${OrderActionNames.CHANGE_PAYMENT}`}
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
							<input type="hidden" name="paymentStatus" value={PaymentStatus.UNPAID} />
							<MarcosButton
								icon={IconType.NOT_DONE}
								textVariant={ButtonText.NO_COLOR}
								variant={ButtonStyle.DELETE_VARIANT}
								type="submit"
							>
								No pagado
							</MarcosButton>
						</form>
					{/if}

					<Divider></Divider>

					<form
						method="post"
						class="flex flex-col gap-2"
						action={`?/${OrderActionNames.CHANGE_PAYMENT}`}
						use:enhance={() => {
							loading = true;
							return async ({ update }) => {
								await update();
								loading = false;
							};
						}}
					>
						<input type="hidden" name="paymentStatus" value={PaymentStatus.PARTIALLY_PAID} />
						<Input type="number" name="amount" required placeholder="Cantidad EUR" step="0.01" />

						<MarcosButton
							icon={IconType.COINS}
							textVariant={ButtonText.NO_COLOR}
							variant={ButtonStyle.ORDER_FINISHED_VARIANT}
							type="submit"
						>
							Pago a cuenta
						</MarcosButton>
					</form>
				{/if}
			{/if}
		</div>
	{/snippet}
</BottomSheet>
