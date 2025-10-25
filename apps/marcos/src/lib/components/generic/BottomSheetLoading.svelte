<script lang="ts">
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
</script>

<div class="py-6">
	<div class="flex w-full flex-col items-center justify-center gap-2">
		<div class="animate-spin">
			<Icon size={IconSize.XXXL} type={IconType.LOADING_BALL} />
		</div>
		<span class="text-md text-gray-600">Aplicando cambios...</span>
	</div>
</div>
