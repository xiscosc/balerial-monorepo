<script lang="ts">
	import type { File as MMSSFile } from '@marcsimolduressonsardina/core/type';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Loading from '@/components/generic/Loading.svelte';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import { ButtonVariant } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { Skeleton } from '@/components/ui/skeleton';

	interface Props {
		files: MMSSFile[];
		deleteFunction: (id: string) => Promise<void>;
	}

	let { files, deleteFunction }: Props = $props();
	let currentIndex = $state(0);
	let isOpen = $state(false);
	let isLoading = $state(false);
	let sheetLoading = $state(false);
	let picturesLoaded = $state(Array(files.length).fill(false));

	async function handleDelete() {
		sheetLoading = true;
		await deleteFunction(files[currentIndex].id);
		closeGallery();
		sheetLoading = false;
	}

	function next(e: Event) {
		e.stopPropagation();
		isLoading = true;
		currentIndex = (currentIndex + 1) % files.length;
	}

	function previous(e: Event) {
		e.stopPropagation();
		isLoading = true;
		currentIndex = (currentIndex - 1 + files.length) % files.length;
	}

	function closeGallery() {
		isOpen = false;
	}

	function openGallery(index: number) {
		currentIndex = index;
		isLoading = true;
		isOpen = true;
	}
</script>

<div class="flex flex-wrap gap-2">
	{#each files as file, i (file.id)}
		<button class="aspect-square w-16 overflow-hidden rounded-sm" onclick={() => openGallery(i)}>
			{#if !picturesLoaded[i]}
				<Skeleton class="h-full w-full" />
			{/if}
			<img
				src={file.thumbnailDownloadUrl ?? file.downloadUrl}
				alt={file.originalFilename}
				class="h-full w-full object-cover transition-transform hover:scale-105"
				onload={() => {
					picturesLoaded[i] = true;
				}}
				class:hidden={!picturesLoaded[i]}
			/>
		</button>
	{/each}
</div>

{#if isOpen}
	<div class="fixed inset-0 z-50">
		<!-- Backdrop -->
		<div
			aria-label="Close gallery"
			tabindex="0"
			class="absolute inset-0 bg-white/90 backdrop-blur-sm"
			onclick={() => closeGallery()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					closeGallery();
				}
			}}
			role="button"
		></div>

		<!-- Modal Content -->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			{#if isLoading}
				<!-- Spinner or loading indicator -->
				<div class="absolute inset-0 flex items-center justify-center">
					<Loading text="Cargando imagen" />
				</div>
			{/if}
			<img
				src={files[currentIndex].downloadUrl}
				alt={files[currentIndex].originalFilename}
				onload={() => {
					isLoading = false;
				}}
				class:hidden={isLoading}
				class="pointer-events-auto max-h-[90vh] max-w-[90vw] rounded-sm object-contain"
			/>
		</div>

		<!-- Buttons on the Blur -->
		<button
			class:hidden={files.length === 1}
			class="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
			onclick={(e) => {
				e.stopPropagation();
				previous(e);
			}}
		>
			<Icon type={IconType.LEFT}></Icon>
		</button>
		<button
			class:hidden={files.length === 1}
			class="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
			onclick={(e) => {
				e.stopPropagation();
				next(e);
			}}
		>
			<Icon type={IconType.RIGHT}></Icon>
		</button>
		<div class="absolute top-4 right-4 flex flex-row gap-1">
			<button
				class="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
				onclick={(e) => {
					e.stopPropagation();
					closeGallery();
				}}
			>
				<Icon type={IconType.CLOSE}></Icon>
			</button>
			<BottomSheet
				title="Eliminar imagen"
				description="Esta acción no se puede deshacer"
				iconType={IconType.TRASH}
			>
				{#snippet trigger({ props }: { props: Record<string, unknown> })}
					<button
						{...props}
						class="rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
						type="button"
					>
						<Icon type={IconType.TRASH}></Icon>
					</button>
				{/snippet}
				{#snippet action()}
					{#if sheetLoading}
						<BottomSheetLoading />
					{:else}
						<MarcosButton
							icon={IconType.TRASH}
							variant={ButtonVariant.DELETE}
							onclick={handleDelete}
						>
							Confirmar
						</MarcosButton>
					{/if}
				{/snippet}
			</BottomSheet>
		</div>
	</div>
{/if}
