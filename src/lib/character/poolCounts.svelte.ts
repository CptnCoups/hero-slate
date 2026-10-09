import type { StateStore } from '$lib/state/store';
import type { ResolvedPool } from './pools';

/**
 * The remaining uses of a character's pools, shared by every block that spends
 * them — the pool dots and the spell breakout — so a cast updates the dots.
 * Each change is saved under the "pools" key, as the pools block always did.
 */
export class PoolCounts {
	readonly pools: ResolvedPool[];
	counts = $state<Record<string, number>>({});
	#store: StateStore | undefined;
	#id: string;

	constructor(pools: ResolvedPool[], store?: StateStore, id = '') {
		this.pools = pools;
		this.#store = store;
		this.#id = id;
		this.counts = Object.fromEntries(pools.map((pool) => [pool.id, pool.current]));
	}

	has(poolId: string): boolean {
		return this.pools.some((pool) => pool.id === poolId);
	}

	remaining(poolId: string): number {
		return this.counts[poolId] ?? 0;
	}

	/** Tap a dot: tapping a filled dot empties down to it, an empty dot fills up to it. */
	select(poolId: string, dot: number): void {
		const current = this.remaining(poolId);
		this.#set(poolId, dot <= current ? dot - 1 : dot);
	}

	/** Use one charge. Returns false, changing nothing, when the pool is empty or unknown. */
	spend(poolId: string): boolean {
		if (!this.has(poolId) || this.remaining(poolId) < 1) return false;
		this.#set(poolId, this.remaining(poolId) - 1);
		return true;
	}

	persist(): void {
		const snapshot = Object.create(null) as Record<string, number>;
		for (const pool of this.pools) snapshot[pool.id] = this.counts[pool.id];
		this.#store?.write(this.#id, 'pools', snapshot).catch(() => {});
	}

	#set(poolId: string, value: number): void {
		const next = Object.assign(Object.create(null), this.counts) as Record<string, number>;
		next[poolId] = value;
		this.counts = next;
		this.persist();
	}
}
