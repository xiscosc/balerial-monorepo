<script lang="ts">
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';
</script>

<MarcosButton
	type="submit"
	formaction={`?/${OrderActionNames.CREATE_EXTERNAL_ORDER}`}
	icon={IconType.PRINTER}
	variant={ButtonStyle.ORDER_GENERIC}
	textVariant={ButtonText.GRAY}
>
	Imprimir
</MarcosButton>
