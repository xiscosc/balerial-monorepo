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
	import { Tracking } from '@/shared/tracking';
	import { initNetworkStatus } from '@/shared/network/network-status.svelte';
	import ActionBar from '@/components/business-related/action-bar/ActionBar.svelte';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { Toaster } from 'svelte-sonner';
	import { authClient } from '@/client/auth-client';
	import { goto } from '$app/navigation';
	import * as DropdownMenu from '@/components/ui/dropdown-menu';

	interface Props {
		data: LayoutData;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	Tracking.init(data.envName, data.user);
	injectSpeedInsights();
	initNetworkStatus();

	$effect(() => {
		if (!navigating.from) {
			Tracking.flushErrorQueue();
		}
	});

	const headerColors: Record<string, string> = {
		prod: 'bg-[#e9eae3]/70 border-gray-300',
		pre: 'bg-red-600/80 border-red-600',
		dev: 'bg-amber-700/50 border-amber-700'
	};

	const emojis: Record<string, string> = {
		prod: '',
		pre: '🧪',
		dev: '🔬'
	};

	const onTesting = $derived(data.envName !== 'prod');
	let headerBackgroundClasses = $derived(headerColors[data.envName]);
	let headerEmoji = $derived(emojis[data.envName]);

	const ribbonLabel = $derived.by(() => {
		if (data.envName === 'prod') return null;
		if (data.envName === 'pre') return 'preview';
		if (data.featureBranch === 'local-branch') return 'local';
		return 'feature';
	});

	const ribbonColors: Record<string, string> = {
		preview: 'bg-red-600',
		feature: 'bg-amber-600',
		local: 'bg-sky-600'
	};
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>
<div class="flex min-h-screen flex-col bg-[#eeefe9] print:block print:min-h-0 print:bg-white">
	{#if ribbonLabel}
		<div
			class="pointer-events-none fixed top-1/2 right-0 z-50 -translate-y-1/2 print:hidden"
		>
			<div
				class="flex h-24 w-7 items-center justify-center rounded-l-md shadow-md {ribbonColors[
					ribbonLabel
				]}"
			>
				<span
					class="-rotate-90 text-[11px] font-bold tracking-widest whitespace-nowrap text-white uppercase"
				>
					{ribbonLabel}
				</span>
			</div>
		</div>
	{/if}
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
				<Icon type={IconType.LOGO} />
			</div>

			<div class="flex items-center gap-3">
				{#if data.user.priceManager}
					<a href={resolve('/config')} class="text-black">
						<Icon type={IconType.SETTINGS} />
					</a>
				{/if}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex cursor-pointer items-center rounded-full text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
						aria-label="Menú de usuario"
					>
						<Icon type={IconType.USER} />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-64">
						<DropdownMenu.Label class="flex items-start gap-2 font-normal">
							<Icon type={IconType.USER} />
							<div class="flex min-w-0 flex-col">
								<span class="truncate text-sm font-medium">{data.user.name}</span>
								<span class="truncate text-xs text-gray-500">{data.user.id}</span>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Label class="flex items-center gap-2 font-normal">
							<Icon type={IconType.LOCATION} />
							<span class="truncate text-sm">{data.user.storeId}</span>
						</DropdownMenu.Label>
						{#if onTesting}
							<DropdownMenu.Separator />
							<DropdownMenu.Label class="flex items-center gap-2 font-normal">
								<span class="text-base leading-none">{headerEmoji}</span>
								<div class="flex min-w-0 flex-col">
									<span class="truncate text-sm font-medium">Entorno de pruebas</span>
									<span class="truncate text-xs text-gray-500">{data.featureBranch}</span>
								</div>
							</DropdownMenu.Label>
						{/if}
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							onSelect={async () => {
								await authClient.signOut();
								await goto(resolve('/(other)/auth/signin'));
							}}
						>
							<Icon type={IconType.LOGOUT} />
							Cerrar sesión
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
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

<Toaster richColors />

<style>
	@media print {
		:global(body),
		:global(html) {
			margin: 0 !important;
			padding: 0 !important;
		}
	}
</style>
