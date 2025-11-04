<script lang="ts">
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';
</script>

<div class="flex flex-col gap-2 lg:col-span-2 lg:flex-row">
	<MarcosButton
		type="submit"
		variant={ButtonStyle.ORDER_GENERIC}
		textVariant={ButtonText.GRAY}
		formaction={`?/${OrderActionNames.CREATE_ORDER}`}
		icon={IconType.ORDER_FINISHED}
	>
		Crear pedido
	</MarcosButton>
	<MarcosButton
		type="submit"
		variant={ButtonStyle.ORDER_QUOTE}
		formaction={`?/${OrderActionNames.CREATE_QUOTE}`}
		icon={IconType.ORDER_QUOTE}
	>
		Crear presupuesto
	</MarcosButton>
</div>
