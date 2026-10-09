<script lang="ts">
	// Short Rest and Long Rest.
	//
	// Short rest: spend Hit Dice to heal (each rolls the authored hit die and heals
	// by the total), then refill the pools marked `reset: short`.
	// Long rest: hit points back to full and every pool refilled, Hit Dice
	// included (2024 rules). It asks for a second tap so a stray tap can't wipe
	// the current state.
	import { roller } from '$lib/dice/roller.svelte';
	import { isRollable } from '$lib/dice/roll';
	import type { HitPointsState } from './hitPointsState.svelte';
	import type { PoolCounts } from './poolCounts.svelte';

	let {
		hp,
		counts,
		hitDie = undefined,
		hitDicePool = 'hit-dice'
	}: { hp: HitPointsState; counts?: PoolCounts; hitDie?: string; hitDicePool?: string } = $props();

	let shortOpen = $state(false);
	let confirmLong = $state(false);
	let message = $state('');

	const canSpend = $derived(
		hitDie !== undefined && isRollable(hitDie) && counts?.has(hitDicePool) === true && counts.remaining(hitDicePool) > 0
	);
	const diceLeft = $derived(counts?.has(hitDicePool) ? counts.remaining(hitDicePool) : 0);

	function spendHitDie(): void {
		if (!hitDie || !counts?.spend(hitDicePool)) return;
		const result = roller.roll(hitDie, 'Hit Die');
		if (!result) return;
		const before = hp.current;
		hp.adjust(Math.max(0, result.total));
		message = `Healed ${hp.current - before} (rolled ${result.total}).`;
	}

	function finishShortRest(): void {
		const refilled = counts?.rest('short') ?? [];
		shortOpen = false;
		message = refilled.length > 0 ? `Short rest done. Refilled: ${refilled.join(', ')}.` : 'Short rest done.';
	}

	function longRest(): void {
		if (!confirmLong) {
			confirmLong = true;
			setTimeout(() => (confirmLong = false), 4000);
			return;
		}
		confirmLong = false;
		shortOpen = false;
		hp.set(hp.max);
		counts?.rest('long');
		message = 'Long rest done: full health, and every use and spell slot is back.';
	}
</script>

<div class="rest" data-block="rest">
	<div class="buttons">
		<button type="button" aria-expanded={shortOpen} onclick={() => ((shortOpen = !shortOpen), (message = ''))}>
			🌙 Short Rest
		</button>
		<button type="button" class:confirm={confirmLong} onclick={longRest}>
			{confirmLong ? '🏕️ Tap again to rest' : '🏕️ Long Rest'}
		</button>
	</div>

	{#if shortOpen}
		<div class="short" aria-label="Short rest">
			{#if hitDie && counts?.has(hitDicePool)}
				<p>Spend Hit Dice to heal. Each one rolls {hitDie}.</p>
				<div class="buttons">
					<button type="button" disabled={!canSpend || hp.current >= hp.max} onclick={spendHitDie}>
						🎲 Spend a Hit Die ({diceLeft} left)
					</button>
					<button type="button" onclick={finishShortRest}>✅ Finish short rest</button>
				</div>
			{:else}
				<div class="buttons">
					<button type="button" onclick={finishShortRest}>✅ Finish short rest</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if message}
		<p class="message" aria-live="polite">{message}</p>
	{/if}
</div>

<style>
	.rest {
		display: grid;
		gap: var(--space-2);
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.short {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius-l);
		box-shadow: inset 0 0 0 2px var(--structural);
	}

	p {
		margin: 0;
	}

	.message {
		color: var(--muted);
		font-size: 0.875rem;
	}

	button {
		min-block-size: 2.75rem;
		padding: 0 var(--space-4);
		border: 2px solid var(--structural);
		border-radius: 999px;
		background-color: var(--raised);
		color: inherit;
		font-weight: 800;
		cursor: pointer;
	}

	button[aria-expanded='true'] {
		border-color: var(--foreground);
	}

	button.confirm {
		border-color: #f5b301;
		color: #f5b301;
	}

	button:disabled {
		color: var(--muted);
		cursor: not-allowed;
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
