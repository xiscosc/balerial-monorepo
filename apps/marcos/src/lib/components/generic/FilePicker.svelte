<script lang="ts">
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import { cn } from '$lib/utils.js';

	interface Props {
		files?: File[];
		multiple?: boolean;
		accept?: string;
		placeholder?: string;
		helperText?: string;
		disabled?: boolean;
		onchange?: (files: File[]) => void;
		class?: string;
	}

	let {
		files = $bindable([]),
		multiple = false,
		accept,
		placeholder,
		helperText,
		disabled = false,
		onchange,
		class: className
	}: Props = $props();

	let isDragging = $state(false);

	const mobilePlaceholder = 'Pulsa para seleccionar';
	const desktopPlaceholder = $derived(
		multiple
			? 'Arrastra archivos aquí o pulsa para seleccionar'
			: 'Arrastra un archivo aquí o pulsa para seleccionar'
	);

	function setFiles(next: File[]) {
		files = next;
		onchange?.(next);
	}

	function handleInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const picked = Array.from(input.files ?? []);
		if (picked.length === 0) return;
		setFiles(multiple ? [...files, ...picked] : picked.slice(0, 1));
		input.value = '';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (disabled) return;
		const dropped = Array.from(e.dataTransfer?.files ?? []);
		if (dropped.length === 0) return;
		setFiles(multiple ? [...files, ...dropped] : dropped.slice(0, 1));
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (disabled) return;
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		const next = e.relatedTarget as Node | null;
		if (next == null || !(e.currentTarget as Node).contains(next)) {
			isDragging = false;
		}
	}

	function removeFile(index: number) {
		setFiles(files.filter((_, i) => i !== index));
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class={cn('flex flex-col gap-3', className)}>
	<label
		class={cn(
			'group relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-gray-50 px-6 py-8 text-center transition-colors',
			isDragging
				? 'border-blue-400 bg-blue-50'
				: 'border-gray-300 hover:border-gray-400 hover:bg-gray-100',
			disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
		)}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
	>
		<input
			type="file"
			class="sr-only"
			{multiple}
			{accept}
			{disabled}
			onchange={handleInputChange}
		/>
		<Icon type={IconType.UPLOAD} size={IconSize.XL} />
		<div class="flex flex-col gap-1">
			{#if placeholder}
				<span class="text-sm font-medium text-gray-700">{placeholder}</span>
			{:else}
				<span class="text-sm font-medium text-gray-700 md:hidden">{mobilePlaceholder}</span>
				<span class="hidden text-sm font-medium text-gray-700 md:inline">{desktopPlaceholder}</span>
			{/if}
			{#if helperText}
				<span class="text-xs text-gray-500">{helperText}</span>
			{/if}
		</div>
	</label>

	{#if files.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each files as file, i (`${file.name}-${file.size}-${i}`)}
				<div
					class="flex items-center gap-2 rounded-full border border-gray-300 bg-white py-1 pl-3 pr-1 text-sm"
				>
					<Icon type={IconType.DOCUMENT} size={IconSize.SMALL} />
					<span class="font-medium text-gray-800">{file.name}</span>
					<span class="text-xs text-gray-500">{formatSize(file.size)}</span>
					<button
						type="button"
						aria-label="Eliminar archivo"
						onclick={() => removeFile(i)}
						class="flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
					>
						<Icon type={IconType.CLOSE} size={IconSize.SMALL} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
