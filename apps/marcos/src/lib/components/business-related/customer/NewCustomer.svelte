<script lang="ts">
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import * as Form from '@/components/ui/form/index.js';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import Box from '@/components/generic/Box.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonAction, ButtonStyle } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Input from '@/components/ui/input/input.svelte';
	import {
		customerSchema,
		linkCustomerSchema,
		type CustomerSchema,
		type LinkCustomerSchema
	} from '@/shared/form-schema/customer.form-schema';
	interface Props {
		data: {
			form: SuperValidated<Infer<CustomerSchema | LinkCustomerSchema>>;
		};
		title?: string;
		link?: boolean;
		icon?: IconType;
		buttonText?: string;
	}

	let { data, icon, title = 'Crear Cliente', buttonText = 'Crear', link = false }: Props = $props();
	const form = superForm(data.form, {
		validators: zodClient(link ? linkCustomerSchema : customerSchema)
	});
	const { form: formData, enhance, submitting } = form;
</script>

<Box {title} {icon}>
	<div>
		<form method="POST" use:enhance class="flex flex-col gap-2">
			{#if $submitting}
				<ProgressBar text="Guardando cambios" />
			{:else}
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Nombre</Form.Label>
							<Input {...props} bind:value={$formData.name} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="phone">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Teléfono</Form.Label>
							<Input type="tel" {...props} bind:value={$formData.phone} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Button
					icon={IconType.EDIT}
					text={buttonText}
					style={ButtonStyle.NEUTRAL}
					action={ButtonAction.SUBMIT}
				></Button>
			{/if}
		</form>
	</div>
</Box>
