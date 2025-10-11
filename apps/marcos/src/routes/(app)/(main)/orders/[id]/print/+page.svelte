<script lang="ts">
	import type { PageData } from './$types';
	import { identifyUser } from '@/shared/fronted-analytics/posthog';
	import OrderPrint from '@/components/business-related/order-detail/OrderPrint.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	identifyUser(data.user, data.envName);
</script>

{#snippet actionButtons()}
	<Button text="Volver atrás" icon={IconType.LEFT} onClick={() => window.history.back()}></Button>
	<Button
		text="Ir al pedido"
		icon={IconType.ORDER_DEFAULT}
		link={`/orders/${data.fullOrder.order.id}`}
	></Button>
{/snippet}

<div class="flex w-full items-center justify-center print:block">
	<div class="w-fit print:w-auto">
		<OrderPrint fullOrder={data.fullOrder} print buttons={actionButtons}></OrderPrint>
	</div>
</div>
