<script lang="ts">
	import { roller, type Roller } from './roller.svelte';

	// A bar pinned to the bottom of the sheet: the latest roll, and a tray with
	// the free dice, advantage, crit, mute, and recent rolls.
	let { dice = roller }: { dice?: Roller } = $props();

	let open = $state(false);
	const latest = $derived(dice.latest);
	const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100];
</script>

<div class="tray" data-block="dice" class:open>
	{#if open}
		<div class="panel" aria-label="Dice tray">
			<div class="controls">
				<button type="button" class="switch" aria-pressed={dice.crit} onclick={() => (dice.crit = !dice.crit)}>
					💥 Crit damage
				</button>
				<button type="button" class="switch" aria-pressed={!dice.muted} onclick={() => dice.setMuted(!dice.muted)}>
					{dice.muted ? '🔇 Sound off' : '🔊 Sound on'}
				</button>
			</div>

			<div class="dice">
				{#each DIE_SIDES as sides}
					<button type="button" class="die" aria-label={`Roll a d${sides}`} onclick={() => dice.roll(`d${sides}`)}>
						d{sides}
					</button>
				{/each}
			</div>

			{#if dice.history.length > 1}
				<ol class="history" aria-label="Recent rolls">
					{#each dice.history.slice(1) as past (past.id)}
						<li>
							<span class="history-label">{past.label ?? past.expression}</span>
							<span class="history-total" class:crit={past.critical} class:fumble={past.fumble}>{past.total}</span>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/if}

	<div class="bar">
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
		<button type="button" class="open" aria-expanded={open} aria-label="Dice tray" onclick={() => (open = !open)}>
			🎲
		</button>
	</div>
</div>

<style>
	.tray {
		position: sticky;
		bottom: var(--space-3);
		z-index: 10;
		display: grid;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: var(--raised);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow), 0 -4px 16px rgb(0 0 0 / 0.25);
	}

	.bar {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.latest {
		flex: 1;
		min-inline-size: 0;
	}

	.hint {
		color: var(--muted);
	}

	.result {
		display: flex;
		align-items: center;
		gap: var(--space-3);
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
	.result.crit .callout,
	.history-total.crit {
		color: #f5b301;
	}

	.result.crit {
		animation: pop 0.25s ease-out, shake 0.5s 0.1s;
	}

	.result.crit .callout {
		text-shadow: 0 0 12px rgb(245 179 1 / 0.8);
	}

	.result.fumble .total,
	.result.fumble .callout,
	.history-total.fumble {
		color: #e5534b;
	}

	.open {
		flex: none;
		inline-size: 3rem;
		block-size: 3rem;
		border-radius: 50%;
		border: 3px solid var(--structural);
		background-color: transparent;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.open[aria-expanded='true'] {
		border-color: var(--foreground);
	}

	.panel {
		display: grid;
		gap: var(--space-3);
	}

	.controls,
	.dice {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.switch,
	.die {
		min-block-size: 2.75rem;
		padding: 0 var(--space-3);
		border: 0;
		background: transparent;
		color: inherit;
		font-weight: 800;
		cursor: pointer;
	}

	.switch,
	.die {
		border: 2px solid var(--structural);
		border-radius: 999px;
	}

	.switch[aria-pressed='true'] {
		border-color: var(--foreground);
		background-color: color-mix(in srgb, var(--foreground) 15%, transparent);
	}

	.die {
		min-inline-size: 3.25rem;
	}

	.history {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
		max-block-size: 10rem;
		overflow-y: auto;
		font-size: 0.875rem;
	}

	.history li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-3);
		color: var(--muted);
	}

	.history-total {
		font-weight: 800;
		color: var(--foreground);
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
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
