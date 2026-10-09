<script lang="ts">
	// Saving throws: one tile per stat that has an authored `save`, each a tap-to-roll
	// d20 check. Renders nothing when no stat has a save.
	import { resolveAbilities } from './abilities';
	import { roller } from '$lib/dice/roller.svelte';
	import { slug } from '$lib/sheetUi.svelte';

	let { abilities }: { abilities: unknown } = $props();

	const saves = $derived(resolveAbilities(abilities).filter((entry) => entry.save !== null));
</script>

{#if saves.length > 0}
	<section class="saves" aria-label="Saving throws" data-block="saves">
		{#each saves as entry}
			<button
				type="button"
				class="save"
				id={`save-${slug(entry.label)}`}
				aria-label={`Roll ${entry.label} save, d20${entry.save}`}
				onclick={() => roller.roll(entry.save!, `${entry.label} save`)}
			>
				<span class="label">{entry.label.slice(0, 3)}</span>
				<span class="bonus">{entry.save}</span>
			</button>
		{/each}
	</section>
{/if}

<style>
	.saves {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
		gap: var(--space-2);
	}

	.save {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		min-block-size: 2.75rem;
		padding: 0 var(--space-3);
		background-color: var(--raised);
		border: 0;
		border-inline-start: 0.3rem solid var(--structural);
		border-radius: var(--radius-m);
		box-shadow: var(--shadow);
		color: inherit;
		cursor: pointer;
	}

	.save:hover {
		background-color: color-mix(in srgb, var(--structural) 30%, var(--raised));
	}

	.save:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}

	.label {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.bonus {
		white-space: nowrap;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--deep);
	}

	.bonus::after {
		content: ' 🎲';
		font-size: 0.75rem;
		opacity: 0.6;
	}
</style>
