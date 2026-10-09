<script lang="ts">
	// The 🎲 button on the search line and the menu it drops down: free dice, crit
	// damage, sound, and recent rolls. The latest roll shows in the bar at the bottom.
	import { roller, type Roller } from './roller.svelte';

	let { dice = roller }: { dice?: Roller } = $props();

	let open = $state(false);
	const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100];
</script>

<div class="menu-anchor">
	<button type="button" class="open" aria-expanded={open} aria-label="Dice tray" onclick={() => (open = !open)}>
		🎲
	</button>
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

			{#if dice.history.length > 0}
				<ol class="history" aria-label="Recent rolls">
					{#each dice.history as past (past.id)}
						<li>
							<span>{past.label ?? past.expression}</span>
							<span class="history-total" class:crit={past.critical} class:fumble={past.fumble}>{past.total}</span>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/if}
</div>

<style>
	.menu-anchor {
		position: relative;
		flex: none;
	}

	.open {
		inline-size: 2.75rem;
		block-size: 2.75rem;
		border-radius: 50%;
		border: 2px solid var(--structural);
		background-color: var(--raised);
		box-shadow: var(--shadow);
		font-size: 1.25rem;
		cursor: pointer;
	}

	.open[aria-expanded='true'] {
		border-color: var(--foreground);
	}

	/* Drops down from the right edge, under the search line. */
	.panel {
		position: absolute;
		inset-inline-end: 0;
		top: calc(100% + var(--space-2));
		inline-size: min(22rem, calc(100vw - 2rem));
		display: grid;
		gap: var(--space-3);
		padding: var(--space-3);
		background-color: var(--raised);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow), 0 8px 24px rgb(0 0 0 / 0.3);
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
		border: 2px solid var(--structural);
		border-radius: 999px;
		background: transparent;
		color: inherit;
		font-weight: 800;
		cursor: pointer;
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

	.history-total.crit {
		color: #f5b301;
	}

	.history-total.fumble {
		color: #e5534b;
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
