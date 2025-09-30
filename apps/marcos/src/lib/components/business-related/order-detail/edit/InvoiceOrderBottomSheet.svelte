<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonAction, ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import Button from '@/components/generic/button/Button.svelte';
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
	triggerTextType={ButtonText.NO_COLOR}
	triggerStyle={order.invoiced ? ButtonStyle.ORDER_PICKED_UP_VARIANT : ButtonStyle.DELETE_VARIANT}
>
	{#snippet trigger()}
		{#if order.invoiced}
			<Button text="Facturado" icon={IconType.INVOICED} action={ButtonAction.TRIGGER}></Button>
		{:else}
			<Button text="No Facturado" icon={IconType.NOT_INVOICED} action={ButtonAction.TRIGGER}
			></Button>
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
					<Button
						text="Marcar como no facturado"
						icon={IconType.NOT_INVOICED}
						textType={ButtonText.NO_COLOR}
						style={ButtonStyle.DELETE_VARIANT}
						action={ButtonAction.SUBMIT}
					></Button>
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
					<Button
						text="Marcar como facturado"
						icon={IconType.INVOICED}
						textType={ButtonText.NO_COLOR}
						style={ButtonStyle.ORDER_PICKED_UP_VARIANT}
						action={ButtonAction.SUBMIT}
					></Button>
				</form>
			{/if}
		</div>
	{/snippet}
</BottomSheet>
