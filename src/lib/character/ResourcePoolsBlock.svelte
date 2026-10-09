<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { StateStore } from '$lib/state/store';
	import { resolvePalette } from '$lib/theme/resolve';
	import { resolvePools } from './pools';
	import { PoolCounts } from './poolCounts.svelte';

	// `shared` lets the sheet hand in the counts the spell breakout also spends;
	// without it the block keeps its own.
	let {
		pools,
		storedPools,
		store,
		id = '',
		shared = undefined
	}: { pools: unknown; storedPools: unknown; store?: StateStore; id?: string; shared?: PoolCounts } = $props();
	const counts = untrack(() => shared ?? new PoolCounts(resolvePools(pools, storedPools), store, id));
	const resolved = counts.pools;

	onMount(() => counts.persist());
</script>

{#if resolved.length > 0}
	<section class="resource-pools" aria-label="Resource pools" data-block="pools">
		{#each resolved as pool (pool.id)}
			<div class="pool" id={`pool-${pool.id}`} data-palette={resolvePalette(pool.color)} data-pool-size={pool.max > 5 ? 'large' : 'small'}>
				<h3>{pool.label}</h3>
				<div class="dots" aria-label={`${pool.label}: ${counts.remaining(pool.id)} remaining`}>
					{#each Array(pool.max) as _, index}
						{@const dot = index + 1}
						<button
							type="button"
							data-pool-dot={dot <= counts.remaining(pool.id) ? 'filled' : 'empty'}
							aria-label={`${pool.label}: ${dot} remaining`}
							onclick={() => counts.select(pool.id, dot)}
						></button>
					{/each}
				</div>
			</div>
		{/each}
	</section>
{/if}

<style>
	/* Cards sit side by side, each only as wide as its dots, and wrap. */
	.resource-pools {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		gap: var(--space-3);
	}

	/* Each pool is a raised card with its own palette. */
	.pool {
		flex: 0 1 auto;
		max-inline-size: 100%;
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--raised);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow);
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 800;
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	/* A chunky dot that is its own tap target: 2.75rem is 44 CSS pixels. */
	button {
		inline-size: 2.75rem;
		block-size: 2.75rem;
		padding: 0;
		border-radius: 50%;
		cursor: pointer;
	}

	/* A pool of more than 5 uses gets smaller dots so it stays compact. */
	[data-pool-size='large'] .dots {
		gap: var(--space-1);
	}

	/* Specific enough to beat the filled/empty border shorthand below. */
	[data-pool-size='large'] button[data-pool-dot] {
		inline-size: 1.75rem;
		block-size: 1.75rem;
		border-width: 3px;
	}

	button[data-pool-dot='filled'] {
		background-color: var(--tint);
		border: 4px solid var(--deep);
	}

	button[data-pool-dot='empty'] {
		background-color: transparent;
		border: 4px solid var(--structural);
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
