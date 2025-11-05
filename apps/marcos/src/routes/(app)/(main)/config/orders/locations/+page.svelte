<script lang="ts">
	import Box from '@/components/generic/Box.svelte';
	import LocationItem from '@/components/business-related/config/LocationItem.svelte';
	import type { PageData } from './$types';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonStyle } from '@/components/generic/button/button.enum';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import Input from '@/components/ui/input/input.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let locations = $state(data.locations);
	let newLocation = $state(''); // Bind this to the input field for adding a new location

	function addLocation() {
		if (newLocation.trim()) {
			locations = [...locations, newLocation.trim()].filter((l) => l !== ''); // Add the new location
			newLocation = ''; // Reset the input field
		}
	}

	function removeLocation(index: number) {
		locations = locations.filter((_, i) => i !== index); // Remove the selected location
	}
</script>

<div class="flex flex-col gap-2">
	<SimpleHeading icon={IconType.LOCATION}>Gestión de ubicaciones</SimpleHeading>
	<Box>
		<!-- Form to add a new location -->
		<div class="mt-4 space-y-4">
			<!-- Existing locations list -->
			{#each locations as location, index (location)}
				<LocationItem text={location}>
					<MarcosButton
						variant={ButtonStyle.DELETE}
						onclick={() => removeLocation(index)}
						icon={IconType.TRASH}
					>
						Eliminar
					</MarcosButton>
				</LocationItem>
			{/each}
			<div class="flex flex-row gap-2">
				<Input type="text" placeholder="Añadir nueva ubicación" bind:value={newLocation} />
				<MarcosButton
					variant={ButtonStyle.NEUTRAL}
					onclick={addLocation}
					icon={IconType.PLUS}
					iconSize={IconSize.BIG}
				>
					Añadir
				</MarcosButton>
			</div>

			<!-- Form to submit locations -->
			<form method="post" action="?/saveLocations">
				<input type="hidden" name="locations" value={JSON.stringify(locations)} />
				<MarcosButton variant={ButtonStyle.NEUTRAL} type="submit" icon={IconType.EDIT}>
					Guardar cambios
				</MarcosButton>
			</form>
		</div>
	</Box>
</div>
