<script lang="ts">
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';
	import { OrderStatus } from '@marcsimolduressonsardina/core/type';

	interface Props {
		orderStatus?: OrderStatus;
	}

	let { orderStatus = undefined }: Props = $props();
</script>

<MarcosButton type="submit" formaction={`?/${OrderActionNames.EDIT_ORDER}`} icon={IconType.EDIT}>
	{orderStatus === OrderStatus.QUOTE ? 'Editar presupuesto' : 'Editar pedido'}
</MarcosButton>
