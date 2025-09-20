<script lang="ts">
	import ErrorBox from '@/components/generic/ErrorBox.svelte';

	import { page } from '$app/state';

	const status = parseInt(page.url.searchParams.get('status') ?? '') || 500;
</script>

<div class="flex min-h-screen w-full items-center justify-center">
	<ErrorBox status={status === 404 ? 'not-found' : 'error'} />
</div>
