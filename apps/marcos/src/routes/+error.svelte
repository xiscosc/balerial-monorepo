<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import ErrorBox from '@/components/generic/ErrorBox.svelte';
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#F7F5F2]">
	<div class="flex min-h-screen w-full items-center justify-center">
		<ErrorBox
			status={page.status === 404 ? 'not-found' : 'error'}
			errorInfo={page.error?.message}
		/>
	</div>
</div>
