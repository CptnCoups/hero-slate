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

	/**
	 * Refill pools for a rest: a long rest refills every pool. A short rest
	 * refills the pools marked `reset: short`, and gives back `shortRestRegain`
	 * uses to pools that only partly refill. Returns what it gave back, such as
	 * "Channel Divinity +1".
	 */
	rest(kind: 'short' | 'long'): string[] {
		const next = Object.assign(Object.create(null), this.counts) as Record<string, number>;
		const refilled: string[] = [];
		for (const pool of this.pools) {
			const before = next[pool.id];
			let after = before;
			if (kind === 'long' || pool.reset === 'short') after = pool.max;
			else if (pool.shortRestRegain) after = Math.min(pool.max, before + pool.shortRestRegain);
			if (after === before) continue;
			next[pool.id] = after;
			refilled.push(after === pool.max && kind === 'long' ? pool.label : `${pool.label} +${after - before}`);
		}
		this.counts = next;
		this.persist();
		return refilled;
	}

	/** Give back up to `amount` uses, never past the pool's max. */
	regain(poolId: string, amount: number): void {
		const pool = this.pools.find((p) => p.id === poolId);
		if (!pool) return;
		this.#set(poolId, Math.min(pool.max, this.remaining(poolId) + amount));
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
