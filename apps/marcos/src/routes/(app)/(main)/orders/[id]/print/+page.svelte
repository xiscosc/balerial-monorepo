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

<div class="flex flex-col gap-2 print:block print:gap-0">
	<div class="lg:w-2xl flex flex-row gap-2 lg:mx-auto lg:justify-center print:hidden">
		<Button text="Volver atrás" icon={IconType.LEFT} onClick={() => window.history.back()}></Button>

		<Button
			text="Ir al pedido"
			icon={IconType.ORDER_DEFAULT}
			link={`/orders/${data.fullOrder.order.id}`}
		></Button>
	</div>
	<OrderPrint fullOrder={data.fullOrder} print></OrderPrint>
</div>

<style>
	@media print {
		:global(body),
		:global(html) {
			height: 210mm !important;
			max-height: 210mm !important;
			overflow: hidden !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		div {
			max-height: none;
		}
	}
</style>
