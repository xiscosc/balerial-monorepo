<script lang="ts">
	interface Props {
		hideOnDesktop?: boolean;
	}

	let { hideOnDesktop = true }: Props = $props();
</script>

<hr class="mt-2 mb-3 border-t border-gray-200" class:md:!hidden={hideOnDesktop} />
