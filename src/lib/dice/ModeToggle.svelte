<script lang="ts">
	// A compact Disadvantage / Normal / Advantage switch for every d20 roll.
	import { roller, type Roller } from './roller.svelte';
	import type { Mode } from './roll';

	let { dice = roller }: { dice?: Roller } = $props();

	const MODES: { mode: Mode; short: string; label: string }[] = [
		{ mode: 'disadvantage', short: 'Dis', label: 'Disadvantage' },
		{ mode: 'normal', short: 'Norm', label: 'Normal' },
		{ mode: 'advantage', short: 'Adv', label: 'Advantage' }
	];
</script>

<div class="toggle" role="radiogroup" aria-label="d20 rolls" data-mode={dice.mode}>
	{#each MODES as m}
		<button
			type="button"
			role="radio"
			aria-checked={dice.mode === m.mode}
			aria-label={m.label}
			title={`Roll d20s with ${m.label.toLowerCase()}`}
			onclick={() => (dice.mode = m.mode)}
		>
			{m.short}
		</button>
	{/each}
</div>

<style>
	.toggle {
		flex: none;
		display: flex;
		block-size: 2.75rem;
		border: 2px solid var(--structural);
		border-radius: 999px;
		overflow: hidden;
		background-color: var(--raised);
		box-shadow: var(--shadow);
	}

	button {
		padding: 0 var(--space-2);
		border: 0;
		background: transparent;
		color: var(--muted);
		font-size: 0.75rem;
		font-weight: 800;
		cursor: pointer;
	}

	button[aria-checked='true'] {
		background-color: var(--foreground);
		color: var(--raised);
	}

	/* Advantage and disadvantage stand out so a stale setting is hard to miss. */
	[data-mode='advantage'] button[aria-checked='true'] {
		background-color: #2f9e57;
		color: #fff;
	}

	[data-mode='disadvantage'] button[aria-checked='true'] {
		background-color: #c94a43;
		color: #fff;
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: -3px;
	}
</style>
