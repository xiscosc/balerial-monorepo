<script lang="ts">
	import type { PageData } from './$types';
	import { Toaster, toast } from 'svelte-sonner';
	import { FileType, type File as MMSSFile } from '@marcsimolduressonsardina/core/type';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import UploadedFile from '@/components/business-related/file/UploadedFile.svelte';
	import { goto } from '$app/navigation';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonAction, ButtonType } from '@/components/generic/button/button.enum';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { Input } from '@/components/ui/input';
	import Photos from '@/components/business-related/file/Photos.svelte';
	import { trackEvent } from '@/shared/fronted-analytics/posthog';
	import Progress from '@/components/ui/progress/progress.svelte';
	import { OrderApiGateway } from '@/gateway/order-api.gateway';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let inputFiles: FileList | undefined = $state();
	let loading = $state(false);
	let uploading = $state(false);
	let loadingProgress = $state(0);
	let loadingText = $state('');
	let files = $state(data.files ?? []);

	let photos = $derived(files.filter((f) => f.type === FileType.PHOTO));
	let videos = $derived(files.filter((f) => f.type === FileType.VIDEO));
	let other = $derived(files.filter((f) => f.type === FileType.OTHER));
	let noArt = $derived(files.filter((f) => f.type === FileType.NO_ART));

	async function deleteFile(id: string) {
		loadingText = 'Eliminando archivo, por favor no cierre la ventana';
		loading = true;
		try {
			await OrderApiGateway.deleteOrderFile(data!.order!.id, id);
		} catch {
			toast.error('Error al eliminar el fichero');
			loading = false;
			return;
		}

		loading = false;
		files = files.filter((f) => f.id != id);
	}

	async function createNoArtFile() {
		loadingText = 'Cargando archivo, por favor no cierre la ventana';
		loading = true;
		try {
			const file = await OrderApiGateway.createOrderFile(
				data!.order!.id,
				'Sin obra',
				FileType.NO_ART
			);
			files = [...files, file];
		} catch {
			toast.error('Error al procesar el fichero');
		}

		loading = false;
	}

	async function createFile(filename: string): Promise<MMSSFile | undefined> {
		try {
			const file = await OrderApiGateway.createOrderFile(data!.order!.id, filename);
			return file;
		} catch {
			toast.error('Error al procesar el fichero');
		}
	}

	async function getFile(id: string): Promise<MMSSFile | undefined> {
		try {
			const file = await OrderApiGateway.getOrderFile(data!.order!.id, id);
			return file;
		} catch {
			toast.error('Error al obtener el fichero');
		}
	}

	async function loadFile() {
		if (inputFiles == null || inputFiles.length === 0) {
			toast.error('Debes seleccionar un archivo');
			return;
		}

		loadingText = 'Cargando archivo, por favor no cierre la ventana';
		uploading = true;
		const filesToUpload = [...inputFiles];
		let progresses = Array(filesToUpload.length).fill(0);

		const uploads = filesToUpload.map((f, i) =>
			uploadIndividualFile(f, (p) => {
				progresses[i] = p;
				loadingProgress = Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length);
			})
		);
		const results = await Promise.all(uploads);
		const uploadedFiles = results.filter((f) => f != null);
		files = [...files, ...uploadedFiles];
		inputFiles = undefined;
		uploading = false;
		loadingProgress = 0;

		if (results.filter((f) => f == null).length > 0) {
			toast.error('Algunos archivos no pudieron cargarse');
		}
	}

	async function uploadIndividualFile(
		fileToUpload: File,
		onProgress: (p: number) => void
	): Promise<MMSSFile | undefined> {
		const file = await createFile(fileToUpload.name);
		if (file == null) return;
		await uploadToS3(file.uploadUrl!, fileToUpload, onProgress);
		return getFile(file.id);
	}

	async function uploadToS3(
		presignedUrl: string,
		file: File,
		onProgress: (p: number) => void
	): Promise<boolean> {
		return new Promise((resolve) => {
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', presignedUrl, true);

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					onProgress(Math.round((event.loaded / event.total) * 100));
				}
			};

			xhr.onload = () => {
				onProgress(100);
				resolve(xhr.status >= 200 && xhr.status < 300);
			};

			xhr.onerror = () => {
				toast.error('Ocurrió un error al cargar el archivo. Por favor, intente nuevamente.');
				resolve(false);
			};

			xhr.send(file);
		});
	}
</script>

<Toaster richColors />

<div class="flex flex-col gap-4">
	<div class="flex w-full flex-row items-end justify-between">
		<SimpleHeading icon={IconType.CAMERA}>Archivos y fotos</SimpleHeading>

		{#if !(loading || uploading)}
			<Button
				text="Volver al pedido"
				icon={IconType.ORDER_PICKED_UP}
				onClick={() => goto(`/orders/${data!.order!.id}`)}
				buttonType={ButtonType.SMALL}
			></Button>
		{/if}
	</div>

	{#if loading}
		<Box>
			<ProgressBar text={loadingText} />
		</Box>
	{/if}
	{#if uploading}
		<Box>
			<div class="flex flex-col items-center gap-3 text-center">
				<span class="text-md font-medium">Cargando archivos...</span>
				<Progress value={loadingProgress} />
				<p>{loadingProgress}%</p>
			</div>
		</Box>
	{/if}

	{#if !loading && !uploading}
		<div class="flex flex-col gap-2">
			<Box title="Carga de archivos">
				<div class="flex flex-col gap-2 md:flex-row">
					<Input type="file" bind:files={inputFiles} onchange={loadFile} multiple />
				</div>
			</Box>

			{#if files.length === 0}
				<Box title="Sin Obra">
					<div class="flex flex-col gap-2 md:flex-row">
						<Button
							action={ButtonAction.CLICK}
							onClick={() => createNoArtFile()}
							text="Añadir archivo Sin Obra"
							icon={IconType.ADD}
							trackFunction={() => trackEvent('No art file created', { orderId: data.order?.id })}
						></Button>
					</div>
				</Box>
			{/if}

			{#if photos.length > 0}
				<Box title="Fotos" collapsible>
					<Photos files={photos} deleteFunction={deleteFile} />
				</Box>
			{/if}

			{#if videos.length > 0}
				<Box title="Vídeos" collapsible>
					<div class="flex flex-col gap-2">
						{#each videos as file (file.id)}
							<UploadedFile
								fileType={FileType.VIDEO}
								fileName={file.originalFilename}
								downloadUrl={file.downloadUrl}
								onDelete={deleteFile}
								id={file.id}
							/>
						{/each}
					</div>
				</Box>
			{/if}

			{#if other.length > 0 || noArt.length > 0}
				<Box title="Otros archivos" collapsible>
					<div class="flex flex-col gap-2">
						{#each other as file (file.id)}
							<UploadedFile
								fileType={file.type}
								fileName={file.originalFilename}
								downloadUrl={file.downloadUrl}
								onDelete={deleteFile}
								id={file.id}
							/>
						{/each}
						{#each noArt as file (file.id)}
							<UploadedFile
								fileType={file.type}
								fileName={file.originalFilename}
								onDelete={deleteFile}
								id={file.id}
							/>
						{/each}
					</div>
				</Box>
			{/if}
		</div>
	{/if}
</div>
