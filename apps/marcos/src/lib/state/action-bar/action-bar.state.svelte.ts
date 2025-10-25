let isVisible = $state(false);

export class ActionBarState {
	public static show() {
		isVisible = true;
	}

	public static hide() {
		isVisible = false;
	}

	public static isVisible() {
		return isVisible;
	}
}
