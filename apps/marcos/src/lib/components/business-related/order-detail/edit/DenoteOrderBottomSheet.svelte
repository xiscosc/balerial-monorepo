<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonVariant } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';
	let sheetLoading = $state(false);

	const enhanceSheetForm = () => {
		sheetLoading = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			sheetLoading = false;
		};
	};
</script>

<BottomSheet
	title="Convertir en presupuesto"
	description="Esta acción no se puede deshacer. El nuevo presupuesto conservará todos los elementos,
precios y fotos del pedido. Se eliminarán pagos a cuenta y fecha de entrega."
	iconType={IconType.ORDER_QUOTE}
>
	{#snippet trigger({ props }: { props: Record<string, unknown> })}
		<MarcosButton {...props} icon={IconType.ORDER_QUOTE} variant={ButtonVariant.ORDER_QUOTE}>
			Convertir en presupuesto
		</MarcosButton>
	{/snippet}

	{#snippet action()}
		<form
			use:enhance={enhanceSheetForm}
			class="w-full"
			method="post"
			action={`?/${OrderActionNames.DENOTE}`}
		>
			{#if sheetLoading}
				<BottomSheetLoading />
			{:else}
				<MarcosButton icon={IconType.EDIT} type="submit">Convertir en presupuesto</MarcosButton>
			{/if}
		</form>
	{/snippet}
</BottomSheet>
