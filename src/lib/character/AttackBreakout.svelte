<script lang="ts">
	import RichText from '$lib/richtext/RichText.svelte';
	import { parse } from '$lib/richtext/parse';
	import { slug } from '$lib/sheetUi.svelte';
	import type { PoolCounts } from './poolCounts.svelte';
	import type { ResolvedAttack } from './attacks';

	// Every attack, with its rollable pills. An attack tied to a pool gets a Use
	// button that spends one use, so the pool dots update with it.
	let { attacks, counts }: { attacks: ResolvedAttack[]; counts?: PoolCounts } = $props();

	const poolLabel = (poolId: string) => counts?.pools.find((pool) => pool.id === poolId)?.label ?? poolId;
</script>

<ul class="attacks" data-block="attacks">
	{#each attacks as attack}
		<li class="attack" id={`attack-${slug(attack.title)}`}>
			<span class="attack-title">{attack.title}</span>
			{#if attack.body}
				<span class="attack-body"><RichText nodes={parse(attack.body)} label={attack.title} /></span>
			{/if}
			{#if attack.pool && counts?.has(attack.pool)}
				{@const left = counts.remaining(attack.pool)}
				<div class="use">
					<button
						type="button"
						disabled={left < 1}
						aria-label={`Use ${attack.title} from ${poolLabel(attack.pool)} (${left} left)`}
						onclick={() => counts.spend(attack.pool!)}
					>
						Use
					</button>
					<span class="left">{left} left</span>
				</div>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.attacks {
		list-style: none;
		margin: 0;
		padding: var(--space-3);
		display: grid;
		gap: var(--space-3);
		border-radius: var(--radius-l);
		box-shadow: inset 0 0 0 2px var(--structural);
	}

	.attack {
		display: grid;
		gap: var(--space-1);
	}

	.attack-title {
		font-family: var(--font-display);
		font-weight: 800;
		color: var(--deep);
	}

	.use {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.left {
		font-size: 0.8125rem;
		color: var(--muted);
	}

	/* A pill button; 2.75rem tall keeps a full tap target. */
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
