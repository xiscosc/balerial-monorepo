import type { Snippet } from 'svelte';

let isVisible = $state(false);
let closeHandler = $state(<() => void>(() => {}));
let startSectionSnippet: Snippet<[]> | undefined = $state(undefined);
let centerSectionSnippet: Snippet<[]> | undefined = $state(undefined);
let actionsSectionSnippet: Snippet<[]> | undefined = $state(undefined);

export class ActionBarState {
	public static show() {
		isVisible = true;
	}

	public static hide() {
		isVisible = false;
	}

	public static destroy() {
		isVisible = false;
		closeHandler = () => {};
		startSectionSnippet = undefined;
		centerSectionSnippet = undefined;
		actionsSectionSnippet = undefined;
	}

	public static isVisible() {
		return isVisible;
	}

	public static setCloseHandler(handler: () => void) {
		closeHandler = handler;
	}

	public static getCloseHandler() {
		return closeHandler;
	}

	public static setStartSectionSnippet(snippet: Snippet | undefined) {
		startSectionSnippet = snippet;
	}

	public static getStartSectionSnippet() {
		return startSectionSnippet;
	}

	public static setCenterSectionSnippet(snippet: Snippet | undefined) {
		centerSectionSnippet = snippet;
	}

	public static getCenterSectionSnippet() {
		return centerSectionSnippet;
	}

	public static setActionsSectionSnippet(snippet: Snippet | undefined) {
		actionsSectionSnippet = snippet;
	}

	public static getActionsSectionSnippet() {
		return actionsSectionSnippet;
	}
}
