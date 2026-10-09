<script lang="ts">
	// The combat block: solid accent tiles of label-and-value pairs, distinct from
	// the raised abilities tiles, with the value prominent. It resolves the loosely-typed
	// `combat` field itself and renders nothing when no valid entry remains. All
	// text comes from Svelte text bindings, so authored values can never inject markup.
	import { resolveCombat, type ResolvedCombat } from './combat';
	import { resolveCombatPalette } from '$lib/theme/roles';
	import { resolvePalette } from '$lib/theme/resolve';
	import type { PaletteName } from '$lib/theme/palette';
	import { slug } from '$lib/sheetUi.svelte';

	// `name` lets the same tiles show another group, such as Senses.
	let {
		combat,
		palette,
		name = 'Combat',
		block = 'combat'
	}: { combat: unknown; palette?: string; name?: string; block?: string } = $props();

	const entries: ResolvedCombat[] = $derived(resolveCombat(combat));
	const fallback: PaletteName = $derived(resolvePalette(palette));
</script>

{#if entries.length > 0}
	<section class="combat" aria-label={name} data-block={block}>
		{#each entries as entry}
			<div class="combat-entry" id={`${block}-${slug(entry.label)}`} data-palette={resolveCombatPalette(entry.label, fallback)}>
				<span class="label">{entry.label}</span>
				<span class="value">{entry.value}</span>
			</div>
		{/each}
	</section>
{/if}

<style>
	.combat {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
		gap: var(--space-3);
	}

	/* A solid accent tile. Text uses on-accent, the contrast-checked pairing. */
	.combat-entry {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-2);
		background-color: var(--accent);
		color: var(--on-accent);
		border-radius: var(--radius-m);
		box-shadow: var(--shadow);
		text-align: center;
	}

	.label {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.value {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 800;
		line-height: 1;
	}
</style>
