<script lang="ts">
	import { roller, type Roller } from './roller.svelte';

	// A bar pinned to the bottom of the sheet showing the latest roll. The dice
	// menu itself (free dice, crit, sound, recent rolls) is on the search line.
	let { dice = roller }: { dice?: Roller } = $props();

	const latest = $derived(dice.latest);
</script>

<div class="tray" data-block="dice">
	<div class="latest" aria-live="polite">
		{#if latest}
			{#key latest.id}
				<div class="result" class:crit={latest.critical} class:fumble={latest.fumble}>
					<span class="total" data-roll-total>{latest.total}</span>
					<span class="detail">
						<span class="what">{latest.label ? `${latest.label}: ` : ''}{latest.expression}{latest.mode !== 'normal'
								? ` (${latest.mode === 'advantage' ? 'adv.' : 'disadv.'})`
								: ''}{latest.crit ? ' (crit)' : ''}</span>
						<span class="dice-values">
							{#each latest.dice as d}
								<span class="die-value" class:dropped={!d.kept}>{d.value}</span>
							{/each}
							{#if latest.modifier !== 0}
								<span>{latest.modifier > 0 ? '+' : '−'}{Math.abs(latest.modifier)}</span>
							{/if}
						</span>
					</span>
					{#if latest.critical}
						<span class="callout" data-callout="critical">CRITICAL!</span>
					{:else if latest.fumble}
						<span class="callout" data-callout="fumble">Oops!</span>
					{/if}
				</div>
			{/key}
		{:else}
			<span class="hint">Tap any 🎲 to roll</span>
		{/if}
	</div>
</div>

<style>
	.tray {
		position: sticky;
		bottom: var(--space-3);
		z-index: 10;
		padding: var(--space-2) var(--space-3);
		background-color: var(--raised);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow), 0 -4px 16px rgb(0 0 0 / 0.25);
	}

	.latest {
		min-inline-size: 0;
		min-block-size: 2.5rem;
		display: flex;
		align-items: center;
	}

	.hint {
		color: var(--muted);
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
