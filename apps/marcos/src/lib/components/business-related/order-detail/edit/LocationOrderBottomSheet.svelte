<script lang="ts">
	import * as Form from '@/components/ui/form/index.js';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import {
		locationOrderSchema,
		type LocationOrderSchema
	} from '@/shared/form-schema/order.form-schema';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { Order } from '@marcsimolduressonsardina/core/type';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import * as NativeSelect from '@/components/ui/native-select/index.js';
	import { OrderActionNames } from '@/shared/mappings/order.mapping';

	interface Props {
		data: SuperValidated<Infer<LocationOrderSchema>>;
		locations: string[];
		order: Order;
	}

	let { data, locations, order }: Props = $props();
	const form = superForm(data, { validators: zod4Client(locationOrderSchema) });

	const { form: formData, enhance, submitting } = form;
</script>

<BottomSheet
	title="Cambiar ubicación"
	description="Seleccione donde se ha dejado el pedido después de finalizarse"
	iconType={IconType.LOCATION}
>
	{#snippet trigger({ props }: { props: Record<string, unknown> })}
		<MarcosButton
			{...props}
			icon={IconType.LOCATION}
			variant={ButtonStyle.NEUTRAL_VARIANT}
			textVariant={ButtonText.NO_COLOR}
		>
			Ubicación: {order.location.length === 0 ? 'Sin ubicación' : order.location}
		</MarcosButton>
	{/snippet}
	{#snippet action()}
		<form
			method="post"
			use:enhance
			action={`?/${OrderActionNames.SAVE_LOCATION}`}
			class="flex flex-col gap-2"
		>
			{#if $submitting}
				<BottomSheetLoading />
			{:else}
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
				<MarcosButton icon={IconType.EDIT} type="submit">Guardar ubicación</MarcosButton>
			{/if}
		</form>
	{/snippet}
</BottomSheet>
