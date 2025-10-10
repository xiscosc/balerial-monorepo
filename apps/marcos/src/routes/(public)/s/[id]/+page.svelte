<script lang="ts">
	import OrderPrint from '@/components/business-related/order-detail/OrderPrint.svelte';
	import type { PageData } from './$types';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<meta property="og:title" content="Resguardo del pedido" />
	<meta property="og:description" content={`Pedido ${data.fullOrder.order.publicId}`} />
	<meta
		property="og:image"
		content="https://marcsimoldures.com/wp-content/uploads/2017/02/MMlogo111.png"
	/>
	<meta
		property="og:url"
		content={OrderRepresentationUtilities.getOrderPublicUrl(data.fullOrder.order)}
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div class="w-full px-1 py-3">
	<div class="flex justify-center">
		<div class="w-fit">
			<OrderPrint fullOrder={data.fullOrder} print={false} internal={false}></OrderPrint>
		</div>
	</div>
</div>
