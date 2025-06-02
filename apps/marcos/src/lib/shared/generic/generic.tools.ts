export class GenericTools {
	static getIterableNumberList(length: number, start: number = 0): number[] {
		if (length <= 0) {
			return [];
		}

		if (start === 0) {
			return [...Array(length).keys()];
		} else {
			return [...Array(length).keys()].map((i) => i + start);
		}
	}

	static getIterableStringList(length: number, start: number = 0): string[] {
		return this.getIterableNumberList(length, start).map((i) => String(i));
	}
}
