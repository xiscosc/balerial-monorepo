<script lang="ts">
	import { ButtonVariant, ButtonTextVariant } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';
</script>

<MarcosButton
	type="submit"
	formaction={`?/${OrderActionNames.CREATE_EXTERNAL_ORDER}`}
	icon={IconType.PRINTER}
	variant={ButtonVariant.ORDER_GENERIC}
	textVariant={ButtonTextVariant.GRAY}
>
	Imprimir
</MarcosButton>
