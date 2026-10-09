import type { StateStore } from '$lib/state/store';

/**
 * Current hit points, shared by the hit points tracker and the rest controls so
 * a rest or a Hit Die heal updates the tracker. Saved under the "hp" key.
 */
export class HitPointsState {
	current = $state(0);
	readonly max: number;
	#store: StateStore | undefined;
	#id: string;

	constructor(current: number, max: number, store?: StateStore, id = '') {
		this.current = current;
		this.max = max;
		this.#store = store;
		this.#id = id;
	}

	/** Add or subtract hit points, clamped to 0..max. */
	adjust(amount: number): void {
		this.set(this.current + amount);
	}

	set(value: number): void {
		this.current = Math.min(this.max, Math.max(0, value));
		this.persist();
	}

	persist(): void {
		// Writes fail quietly, but guard so a rejection never surfaces or blocks the change.
		this.#store?.write(this.#id, 'hp', this.current).catch(() => {});
	}
}
