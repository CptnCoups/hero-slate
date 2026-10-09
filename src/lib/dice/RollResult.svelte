<script lang="ts">
	import type { LoggedRoll } from './roller.svelte';

	// One roll's result: the total, what was rolled, each die, and a CRITICAL! or
	// Oops! callout on a natural 20 or 1.
	let { roll }: { roll: LoggedRoll } = $props();
	const modeNote = $derived(roll.mode === 'normal' ? '' : roll.mode === 'advantage' ? ' (adv.)' : ' (disadv.)');
</script>

{#key roll.id}
	<div class="result" class:crit={roll.critical} class:fumble={roll.fumble} data-mode={roll.mode}>
		<span class="total" data-roll-total>{roll.total}</span>
		{#if roll.mode !== 'normal'}
			<span class="mode-badge">{roll.mode === 'advantage' ? 'ADV' : 'DIS'}</span>
		{/if}
		<span class="detail">
			<span class="what">{roll.label ? `${roll.label}: ` : ''}{roll.expression}{modeNote}{roll.crit ? ' (crit)' : ''}</span>
			<span class="dice-values">
				{#each roll.dice as d}
					<span class="die-value" class:dropped={!d.kept}>{d.value}</span>
				{/each}
				{#if roll.modifier !== 0}
					<span>{roll.modifier > 0 ? '+' : '−'}{Math.abs(roll.modifier)}</span>
				{/if}
			</span>
		</span>
		{#if roll.critical}
			<span class="callout" data-callout="critical">CRITICAL!</span>
		{:else if roll.fumble}
			<span class="callout" data-callout="fumble">Oops!</span>
		{/if}
	</div>
{/key}

<style>
	/* Advantage rolls are green and disadvantage rolls red, like the toggle. A
	   natural 20 or 1 keeps its gold or red total on top of that. */
	.result[data-mode='advantage'] .total {
		color: #2f9e57;
	}

	.result[data-mode='disadvantage'] .total {
		color: #c94a43;
	}

	.mode-badge {
		padding: 0.1em 0.5em;
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #fff;
	}

	.result[data-mode='advantage'] .mode-badge {
		background-color: #2f9e57;
	}

	.result[data-mode='disadvantage'] .mode-badge {
		background-color: #c94a43;
	}

	.result {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-inline-size: 0;
		animation: pop 0.25s ease-out;
	}

	.total {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 800;
		line-height: 1;
		min-inline-size: 2.5ch;
		text-align: center;
	}

	.detail {
		display: grid;
		min-inline-size: 0;
		font-size: 0.875rem;
	}

	.what {
		font-weight: 800;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dice-values {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		color: var(--muted);
	}

	.die-value.dropped {
		text-decoration: line-through;
		opacity: 0.6;
	}

	.callout {
		margin-inline-start: auto;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.25rem;
		white-space: nowrap;
	}

	.result.crit .total,
	.result.crit .callout {
		color: #f5b301;
	}

	.result.crit {
		animation: pop 0.25s ease-out, shake 0.5s 0.1s;
	}

	.result.crit .callout {
		text-shadow: 0 0 12px rgb(245 179 1 / 0.8);
	}

	.result.fumble .total,
	.result.fumble .callout {
		color: #e5534b;
	}

	@keyframes pop {
		from {
			transform: scale(0.85);
			opacity: 0.4;
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.result,
		.result.crit {
			animation: none;
		}
	}
</style>
