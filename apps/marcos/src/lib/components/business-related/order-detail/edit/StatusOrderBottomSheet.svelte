<script lang="ts">
	import * as Form from '@/components/ui/form/index.js';
	import * as NativeSelect from '@/components/ui/native-select/index.js';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonTextVariant } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { OrderActionNames, orderStatusMap } from '@/shared/mappings/order.mapping';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { getStatusUIInfo, getStatusUIInfoWithPaymentInfo } from '@/ui/ui.helper';
	import Divider from '@/components/generic/Divider.svelte';
	import { OrderStatus, type FullOrder } from '@marcsimolduressonsardina/core/type';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import type { StatusOrderSchema } from '@/shared/form-schema/order.form-schema';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';

	interface Props {
		data: SuperValidated<Infer<StatusOrderSchema>>;
		locations: string[];
		fullOrder: FullOrder;
	}

	let { data, locations, fullOrder }: Props = $props();
	const form = superForm(data, {
		onSubmit: async ({ formData }) => {
			await getGlobalProfiler().measureStandalone();
			formData.set('status', newStatus ?? '');
		}
	});

	const { form: formData, enhance, submitting } = form;

	function triggerForm(status: OrderStatus) {
		newStatus = status;
		form.submit();
	}

	let newStatus = $state<OrderStatus>();
	const statuses = OrderRepresentationUtilities.getPossibleNextStatuses(fullOrder.order.status);
	const order = fullOrder.order;
</script>

<BottomSheet
	title="Cambiar estado"
	description="Seleccione el nuevo estado del pedido"
	iconType={getStatusUIInfo(order.status).statusIcon}
>
	{#snippet trigger({ props }: { props: Record<string, unknown> })}
		<MarcosButton
			{...props}
			icon={getStatusUIInfo(order.status).statusIcon}
			variant={getStatusUIInfoWithPaymentInfo(order.status, fullOrder.totals.payed, true).colors}
			textVariant={ButtonTextVariant.NO_COLOR}
		>
			Estado: {orderStatusMap[order.status]}
		</MarcosButton>
	{/snippet}

	{#snippet action()}
		<form
			method="POST"
			use:enhance
			action={`?/${OrderActionNames.CHANGE_STATUS}`}
			class="flex flex-col gap-2"
		>
			{#if $submitting}
				<BottomSheetLoading />
			{:else}
				{#if statuses.includes(OrderStatus.FINISHED)}
					<Form.Field {form} name="location">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Nueva ubicación:</Form.Label>
								<NativeSelect.Root name={props.name} bind:value={$formData.location}>
									<option></option>
									{#each locations as location (location)}
										<option value={location}>{location}</option>
									{/each}
								</NativeSelect.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<MarcosButton
						onclick={() => triggerForm(OrderStatus.FINISHED)}
						textVariant={ButtonTextVariant.NO_COLOR}
						icon={getStatusUIInfo(OrderStatus.FINISHED).statusIcon}
						variant={getStatusUIInfo(OrderStatus.FINISHED, true).colors}
					>
						Cambiar a {orderStatusMap[OrderStatus.FINISHED]}
					</MarcosButton>
					<Divider hideOnDesktop={false}></Divider>
				{/if}

				{#if statuses.includes(OrderStatus.PICKED_UP)}
					<MarcosButton
						textVariant={ButtonTextVariant.NO_COLOR}
						onclick={() => triggerForm(OrderStatus.PICKED_UP)}
						icon={getStatusUIInfo(OrderStatus.PICKED_UP).statusIcon}
						variant={getStatusUIInfo(OrderStatus.PICKED_UP, true).colors}
					>
						Cambiar a {orderStatusMap[OrderStatus.PICKED_UP]}
					</MarcosButton>
				{/if}

				{#if statuses.includes(OrderStatus.PENDING)}
					<MarcosButton
						textVariant={ButtonTextVariant.NO_COLOR}
						onclick={() => triggerForm(OrderStatus.PENDING)}
						icon={getStatusUIInfo(OrderStatus.PENDING).statusIcon}
						variant={getStatusUIInfo(OrderStatus.PENDING, true).colors}
					>
						Cambiar a {orderStatusMap[OrderStatus.PENDING]}
					</MarcosButton>
				{/if}
			{/if}
		</form>
	{/snippet}
</BottomSheet>
