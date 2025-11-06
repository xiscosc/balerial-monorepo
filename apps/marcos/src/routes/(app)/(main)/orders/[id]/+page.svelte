<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import Loading from '@/components/generic/Loading.svelte';
	import OrderInfo from '@/components/business-related/order-detail/OrderInfo.svelte';
	import OrderElements from '@/components/business-related/order-detail/OrderElements.svelte';
	import OrderHeader from '@/components/business-related/order-detail/OrderHeader.svelte';
	import Divider from '@/components/generic/Divider.svelte';
	import { ButtonVariant, ButtonTextVariant } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Box from '@/components/generic/Box.svelte';
	import DeleteOrderBottomSheet from '@/components/business-related/order-detail/edit/DeleteOrderBottomSheet.svelte';
	import PromoteOrderBottomSheet from '@/components/business-related/order-detail/edit/PromoteOrderBottomSheet.svelte';
	import DenoteOrderBottomSheet from '@/components/business-related/order-detail/edit/DenoteOrderBottomSheet.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import Skeleton from '@/components/ui/skeleton/skeleton.svelte';
	import OrderSkeletonHeader from '@/components/business-related/order-detail/OrderSkeletonHeader.svelte';
	import { OrderUtilities } from '@marcsimolduressonsardina/core/util';
	import {
		OrderStatus,
		type Order,
		type OrderAuditTrailEntry
	} from '@marcsimolduressonsardina/core/type';
	import Step from '@/components/generic/Step.svelte';
	import { DateTime } from 'luxon';
	import OrderPriceDetails from '@/components/business-related/order-detail/OrderPriceDetails.svelte';

	import WhatsAppOrderButtons from '@/components/business-related/order-detail/WhatsAppOrderButtons.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import { trackEvent } from '@/shared/fronted-analytics/posthog';
	import { BreakpointStateClass } from '@/state/breakpoint/breakpoint.state.svelte';
	import { onDestroy } from 'svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import TooltipButtonWrapper from '@/components/generic/button/TooltipButtonWrapper.svelte';
	let formLoading = $state(false);

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let derivedInfo = $derived(getGlobalProfiler().measure(data.info));
	const breakpointState = new BreakpointStateClass();

	$effect(() => {
		if (data.info) {
			data.info.then((info) => {
				const order = info.fullOrder?.order;
				if (order != null && OrderUtilities.isOrderTemp(order)) {
					goto(resolve('/(app)/(main)/orders/[id]/link', { id: order.id }));
				}

				if (order == null) {
					trackEvent('Order not found', { orderId: data.orderId });
				}
			});
		}
	});

	onDestroy(() => {
		breakpointState.destroy();
	});
</script>

{#snippet loadingSection(sectionName: string)}
	<div class="lg:mt-3 lg:break-inside-avoid">
		<Box title={sectionName}>
			<div class="flex flex-col gap-2">
				<Skeleton class="h-12 w-full" />
				<Skeleton class="h-12 w-full" />
				<Skeleton class="h-12 w-full" />
				<Skeleton class="h-12 w-full" />
			</div>
		</Box>
	</div>
{/snippet}

{#snippet deleteOrderSection(mobile: boolean, isPriceManager: boolean, order?: Order)}
	{#if isPriceManager && order && ((mobile && breakpointState.isSm()) || (!mobile && !breakpointState.isSm()))}
		<div class="lg:mt-3 lg:break-inside-avoid">
			<Box title="Administración">
				<DeleteOrderBottomSheet {order}></DeleteOrderBottomSheet>
			</Box>
		</div>
	{/if}
{/snippet}

{#snippet notificationSection(entries: OrderAuditTrailEntry[], mobile: boolean)}
	{#if entries.length > 0 && ((mobile && breakpointState.isSm()) || (!mobile && !breakpointState.isSm()))}
		<div class="lg:mt-3 lg:break-inside-avoid">
			<Box title="Avisos al cliente">
				<div class="flex flex-col gap-2">
					{#each entries as entry (entry.id)}
						<Step
							icon={IconType.WHATSAPP}
							title={entry.userName}
							subtitle="Mensaje finalizado - {DateTime.fromJSDate(entry.createdAt).toFormat(
								'dd/MM/yyyy HH:mm'
							)}"
						></Step>
					{/each}
				</div>
			</Box>
		</div>
	{/if}
{/snippet}

<div class="flex flex-col gap-3">
	<SimpleHeading icon={IconType.ORDER_DEFAULT}>Detalles del pedido</SimpleHeading>
	{#await derivedInfo}
		<div class="flex w-full flex-col gap-3 lg:block lg:columns-2">
			<OrderSkeletonHeader></OrderSkeletonHeader>
			{@render loadingSection('Detalles')}
			{@render loadingSection('Elementos')}
		</div>
	{:then info}
		<div class="flex w-full flex-col gap-3 lg:block lg:columns-2">
			{#if info.fullOrder == null}
				<div class="lg:mt-3 lg:break-inside-avoid">
					<Box icon={IconType.ALERT} title="Cliente o pedido no encontrado">
						<p class="text-md">
							El cliente o pedido solicitado no existe, puede haber sido borrado.
						</p>
					</Box>
				</div>
			{:else}
				<OrderHeader
					fullOrder={info.fullOrder}
					locations={info.locations}
					locationForm={data.locationForm}
					statusForm={data.statusForm}
				></OrderHeader>

				{#if !formLoading}
					<div
						class="flex w-full flex-col gap-1 md:grid md:grid-cols-2 lg:mt-3 lg:break-inside-avoid lg:grid-cols-3"
					>
						{#if info.fullOrder.order.status === OrderStatus.QUOTE}
							<PromoteOrderBottomSheet data={data.promoteForm}></PromoteOrderBottomSheet>
						{:else}
							<MarcosButton
								icon={IconType.ORDER_DEFAULT}
								textVariant={ButtonTextVariant.GRAY}
								variant={ButtonVariant.ORDER_GENERIC}
								onclick={() =>
									goto(resolve(`/customers/${info.fullOrder.order.customer.id}/orders`))}
							>
								Pedidos del cliente
							</MarcosButton>
							<MarcosButton
								icon={IconType.DAY}
								textVariant={ButtonTextVariant.GRAY}
								variant={ButtonVariant.ORDER_GENERIC}
								onclick={() => goto(resolve(`/orders/${info.fullOrder.order.id}/day`))}
							>
								Pedidos del día
							</MarcosButton>
							<DenoteOrderBottomSheet></DenoteOrderBottomSheet>
						{/if}

						<WhatsAppOrderButtons
							order={info.fullOrder.order}
							counters={info.unfinishedSameDayCount}
							hasFiles={info.hasFiles}
						></WhatsAppOrderButtons>

						<Divider hideOnDesktop={true}></Divider>
						<TooltipButtonWrapper enabled={!info.hasFiles} text="Faltan fotos">
							<MarcosButton
								disabled={!info.hasFiles}
								icon={IconType.PRINTER}
								onclick={() => goto(resolve(`/orders/${info.fullOrder.order.id}/print`))}
							>
								Imprimir
							</MarcosButton>
						</TooltipButtonWrapper>

						<MarcosButton
							icon={IconType.EDIT}
							onclick={() => goto(resolve(`/orders/${info.fullOrder.order.id}/edit`))}
						>
							Editar
						</MarcosButton>
						<MarcosButton
							icon={IconType.COPY}
							onclick={() => goto(resolve(`/orders/new?originId=${info.fullOrder.order.id}`))}
						>
							Copiar
						</MarcosButton>

						<Divider hideOnDesktop={true}></Divider>
						<MarcosButton
							icon={IconType.CAMERA}
							onclick={() => goto(resolve(`/orders/${info.fullOrder.order.id}/files`))}
						>
							Cámara
						</MarcosButton>
					</div>
				{/if}

				{#if formLoading}
					<span class=""> <Loading text="Aplicando cambios..." /> </span>
				{/if}

				<div class="lg:mt-3 lg:break-inside-avoid">
					<OrderInfo order={info.fullOrder.order}></OrderInfo>
				</div>

				{#if info.notificationEntries.length > 0}
					{@render notificationSection(info.notificationEntries, false)}
				{:else}
					{@render deleteOrderSection(false, data.isPriceManager, info.fullOrder.order)}
				{/if}

				<div class="lg:mt-3 lg:break-inside-avoid">
					<OrderElements fullOrder={info.fullOrder}></OrderElements>
				</div>

				<div class="lg:mt-3 lg:break-inside-avoid">
					<OrderPriceDetails
						quantity={info.fullOrder.calculatedItem.quantity}
						discount={info.fullOrder.calculatedItem.discount}
						unitPriceWithoutDiscount={info.fullOrder.totals.unitPriceWithoutDiscount}
						unitPriceWithDiscount={info.fullOrder.totals.unitPrice}
						totalWithoutDiscount={info.fullOrder.totals.totalWithoutDiscount}
						totalWithDiscount={info.fullOrder.totals.total}
						alertItemsWitouthDiscount={info.fullOrder.totals.discountNotAllowedPresent}
						collapsed={false}
					></OrderPriceDetails>
				</div>

				{@render notificationSection(info.notificationEntries, true)}
				{@render deleteOrderSection(true, data.isPriceManager, info.fullOrder.order)}
				{#if info.notificationEntries.length > 0}
					{@render deleteOrderSection(false, data.isPriceManager, info.fullOrder.order)}
				{/if}
			{/if}
		</div>
	{/await}
</div>
