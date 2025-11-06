<script lang="ts">
	import type { LayoutData } from './$types';
	import { navigating } from '$app/state';
	import { resolve } from '$app/paths';
	import '../../app.css';
	import Loading from '@/components/generic/Loading.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import Box from '@/components/generic/Box.svelte';
	import { type Snippet } from 'svelte';
	import { initPosthog } from '@/shared/fronted-analytics/posthog';
	import ActionBar from '@/components/business-related/action-bar/ActionBar.svelte';
	import { browser } from '$app/environment';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	if (browser) {
		import('@m3e/loading-indicator');
	}

	let { data, children }: Props = $props();

	initPosthog(data.envName, data.user);

	const headerColors = {
		prod: 'bg-[#e9eae3]/70 border-gray-300',
		pre: 'bg-red-500/80 border-red-500',
		dev: 'bg-indigo-500/50 border-indigo-500'
	};

	const headerEmojis = {
		pre: '🧪',
		dev: '👷'
	};

	let onTesting = $state(data.envName !== 'prod');
	let headerBackgroundClasses = $derived(headerColors[data.envName as keyof typeof headerColors]);
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>
<div class="flex min-h-screen flex-col bg-[#eeefe9] print:block print:min-h-0 print:bg-white">
	<header
		class={`sticky top-0 z-20 flex items-center justify-center border-b p-3 backdrop-blur-sm ${headerBackgroundClasses} print:hidden`}
	>
		<div
			class="flex w-full flex-row items-center justify-between px-1 md:px-2 lg:max-w-[1650px] lg:px-3"
		>
			<a href={resolve('/')} class="text-black">
				<Icon type={IconType.HOME} />
			</a>

			<div
				class="pointer-events-none absolute inset-0 flex w-full items-center justify-center gap-3"
			>
				{#if onTesting}
					<span class="text-md font-semibold">
						ENTORNO DE PRUEBAS ({data.envName}) {headerEmojis[
							data.envName as keyof typeof headerEmojis
						]}
					</span>
				{:else}
					<Icon type={IconType.LOGO} />
				{/if}
			</div>

			<div class="flex items-center gap-3">
				{#if data.user.priceManager}
					<a href={resolve('/config')} class="text-black">
						<Icon type={IconType.SETTINGS} />
					</a>
				{/if}
				<a href={resolve('/auth/signout?callbackUrl=/')} class="text-black">
					<Icon type={IconType.LOGOUT} />
				</a>
			</div>
		</div>
	</header>

	<!-- Scrollable Content Block filling remaining space -->
	<main class="flex-1 overflow-y-auto p-2 print:block print:overflow-visible print:p-0">
		<div
			class="mx-auto w-full px-1 pb-3 md:px-2 md:pt-2 md:pb-0 lg:max-w-[1650px] lg:px-4 print:mx-0 print:max-w-none print:p-0"
		>
			{#if navigating.from != null}
				<Box>
					<Loading></Loading>
				</Box>
			{:else}
				{@render children?.()}
			{/if}
		</div>
	</main>

	<ActionBar />
</div>

<style>
	@media print {
		:global(body),
		:global(html) {
			margin: 0 !important;
			padding: 0 !important;
		}
	}
</style>
