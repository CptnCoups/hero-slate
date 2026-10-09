<script lang="ts">
	import RichText from '$lib/richtext/RichText.svelte';
	import { parse } from '$lib/richtext/parse';
	import type { PoolCounts } from './poolCounts.svelte';
	import { slug } from '$lib/sheetUi.svelte';
	import { castOptions, ordinal, type ResolvedSpell } from './spells';

	// Every castable spell, each with one button per pool it can spend. A tap
	// spends one use from that pool, so the pool dots above update with it.
	let { spells, counts }: { spells: ResolvedSpell[]; counts?: PoolCounts } = $props();

	const poolIds = $derived(counts ? counts.pools.map((pool) => pool.id) : []);
	const poolLabel = (poolId: string) => counts?.pools.find((pool) => pool.id === poolId)?.label ?? poolId;
</script>

<ul class="spells" data-block="spells">
	{#each spells as spell}
		{@const options = castOptions(spell, poolIds)}
		<li class="spell" id={`spell-${slug(spell.title)}`}>
			<div class="spell-head">
				<span class="spell-title">{spell.title}</span>
				<span class="spell-level">{spell.level === 0 ? 'cantrip' : ordinal(spell.level)}</span>
			</div>
			{#if spell.body}
				<span class="spell-body"><RichText nodes={parse(spell.body)} label={spell.title} /></span>
			{/if}
			{#if options.length > 0 && counts}
				<div class="cast" role="group" aria-label={`Cast ${spell.title}`}>
					{#each options as option}
						{@const left = counts.remaining(option.poolId)}
						<button
							type="button"
							data-cast={option.label}
							disabled={left < 1}
							aria-label={`Cast ${spell.title} using ${poolLabel(option.poolId)} (${left} left)`}
							onclick={() => counts.spend(option.poolId)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.spells {
		list-style: none;
		margin: 0;
		padding: var(--space-3);
		display: grid;
		gap: var(--space-3);
		border-radius: var(--radius-l);
		background-color: var(--background, transparent);
		box-shadow: inset 0 0 0 2px var(--structural);
	}

	.spell {
		display: grid;
		gap: var(--space-1);
	}

	.spell-head {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
	}

	.spell-title {
		font-family: var(--font-display);
		font-weight: 800;
		color: var(--deep);
	}

	.spell-level {
		font-size: 0.8125rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.cast {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	/* A pill button per slot level; 2.75rem tall keeps a full tap target. */
	button {
		min-inline-size: 3.5rem;
		block-size: 2.75rem;
		padding: 0 var(--space-3);
		border-radius: 999px;
		border: 3px solid var(--deep);
		background-color: var(--tint);
		color: var(--deep);
		font-weight: 800;
		cursor: pointer;
	}

	button:disabled {
		background-color: transparent;
		border-color: var(--structural);
		color: var(--muted);
		cursor: not-allowed;
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
