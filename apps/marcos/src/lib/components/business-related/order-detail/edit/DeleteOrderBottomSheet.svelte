<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonVariant } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { OrderStatus, type Order } from '@marcsimolduressonsardina/core/type';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	let sheetLoading = $state(false);

	interface Props {
		order: Order;
	}

	let { order }: Props = $props();

	const enhanceSheetForm = () => {
		sheetLoading = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			sheetLoading = false;
		};
	};
</script>

<BottomSheet
	title={order.status !== OrderStatus.QUOTE ? 'Eliminar pedido' : 'Eliminar presupuesto'}
	description="Esta acción no se puede deshacer"
	iconType={IconType.TRASH}
>
	{#snippet trigger({ props }: { props: Record<string, unknown> })}
		<MarcosButton {...props} variant={ButtonVariant.DELETE} icon={IconType.TRASH}>
			{order.status !== OrderStatus.QUOTE ? 'Eliminar pedido' : 'Eliminar presupuesto'}
		</MarcosButton>
	{/snippet}

	{#snippet action()}
		<form
			class="w-full"
			method="post"
			action={`?/${OrderActionNames.DELETE}`}
			use:enhance={enhanceSheetForm}
		>
			{#if sheetLoading}
				<BottomSheetLoading />
			{:else}
				<MarcosButton icon={IconType.TRASH} variant={ButtonVariant.DELETE} type="submit">
					Confirmar
				</MarcosButton>
			{/if}
		</form>
	{/snippet}
</BottomSheet>
