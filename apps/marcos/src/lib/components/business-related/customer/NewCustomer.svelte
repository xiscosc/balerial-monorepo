<script lang="ts">
	import Loading from '@/components/generic/Loading.svelte';
	import * as Form from '@/components/ui/form/index.js';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import Box from '@/components/generic/Box.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonVariant } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Input from '@/components/ui/input/input.svelte';
	import {
		customerSchema,
		linkCustomerSchema,
		type CustomerSchema,
		type LinkCustomerSchema
	} from '@/shared/form-schema/customer.form-schema';
	import { trackEvent, trackError } from '@/shared/fronted-analytics/posthog';
	import { toast } from 'svelte-sonner';

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
		validators: zod4Client(link ? linkCustomerSchema : customerSchema),
		timeoutMs: 30000,
		onSubmit: () => {
			trackEvent('Customer form submit started', { link });
		},
		onResult: ({ result }) => {
			trackEvent('Customer form result', { type: result.type, link });
			if (result.type === 'error') {
				toast.error('Error al guardar: ' + (result.error?.message || 'Error desconocido'));
			}
		},
		onError: ({ result }) => {
			const error = result.error instanceof Error ? result.error : new Error(String(result.error));
			trackError(error);
			toast.error('Error: ' + error.message);
		}
	});
	const { form: formData, enhance, submitting } = form;
</script>

<Box {title} {icon}>
	<div>
		<form method="POST" use:enhance class="flex flex-col gap-2">
			{#if $submitting}
				<Loading text="Guardando cambios" />
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
				<MarcosButton icon={IconType.EDIT} variant={ButtonVariant.NEUTRAL} type="submit">
					{buttonText}
				</MarcosButton>
			{/if}
		</form>
	</div>
</Box>
