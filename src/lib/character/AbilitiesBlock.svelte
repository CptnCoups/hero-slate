<script lang="ts">
	// The abilities block: a grid of raised tiles, each with the modifier large and the
	// raw score small beneath it. It resolves the loosely-typed `abilities` field
	// itself and renders nothing when no valid entry remains. All text comes from
	// Svelte text bindings, so authored labels and modifiers can never inject markup.
	//
	// Tapping the modifier rolls a d20 check with it (the dice tray's advantage
	// setting applies). A tile with a save or skills gets a ▾ that lists them,
	// each its own roll.
	import { resolveAbilities, type ResolvedAbility } from './abilities';
	import { isRollable } from '$lib/dice/roll';
	import { roller } from '$lib/dice/roller.svelte';

	let { abilities }: { abilities: unknown } = $props();

	const entries: ResolvedAbility[] = $derived(resolveAbilities(abilities));
	// One stat's save and skills show at a time, in a full-width panel under the tiles.
	let openLabel = $state<string | null>(null);
	const opened = $derived(entries.find((entry) => entry.label === openLabel) ?? null);

	function toggle(label: string): void {
		openLabel = openLabel === label ? null : label;
	}
</script>

{#if entries.length > 0}
	<section class="abilities" aria-label="Abilities" data-block="abilities">
		{#each entries as entry}
			{@const hasMore = entry.save !== null || entry.skills.length > 0}
			<div class="ability" class:expanded={openLabel === entry.label}>
				<span class="label">{entry.label}</span>
				{#if isRollable(entry.modifier)}
					<button
						type="button"
						class="modifier roll"
						aria-label={`Roll ${entry.label} check, d20${entry.modifier}`}
						onclick={() => roller.roll(entry.modifier, `${entry.label} check`)}
					>{entry.modifier}</button>
				{:else}
					<span class="modifier">{entry.modifier}</span>
				{/if}
				{#if entry.score !== null}
					<span class="score">{entry.score}</span>
				{/if}
				{#if hasMore}
					<button
						type="button"
						class="more"
						aria-expanded={openLabel === entry.label}
						aria-label={`${entry.label} save and skills`}
						onclick={() => toggle(entry.label)}
					>{openLabel === entry.label ? '▴' : '▾'}</button>
				{/if}
			</div>
		{/each}
		{#if opened}
			<div class="panel" aria-label={`${opened.label} save and skills`}>
				<h3>{opened.label}</h3>
				<ul class="checks">
					{#if opened.save !== null}
						<li>
							<button
								type="button"
								class="check save"
								aria-label={`Roll ${opened.label} save, d20${opened.save}`}
								onclick={() => roller.roll(opened.save!, `${opened.label} save`)}
							>
								<span>🛡️ Save</span><span class="bonus">{opened.save}</span>
							</button>
						</li>
					{/if}
					{#each opened.skills as skill}
						<li>
							<button
								type="button"
								class="check"
								class:proficient={skill.proficient}
								aria-label={`Roll ${skill.name}, d20${skill.bonus}`}
								onclick={() => roller.roll(skill.bonus, skill.name)}
							>
								<span>{skill.proficient ? '★ ' : ''}{skill.name}</span><span class="bonus">{skill.bonus} 🎲</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>
{/if}

<style>
	/* Six tiles on one row at desktop widths; 3 by 2 at 360px. */
	.abilities {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
		align-items: start;
		gap: var(--space-3);
	}

	/* A raised tile with a structural top border. */
	.ability {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-2);
		background-color: var(--raised);
		border-top: 0.3rem solid var(--structural);
		border-radius: var(--radius-m);
		box-shadow: var(--shadow);
		text-align: center;
	}

	.label {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.modifier {
		font-family: var(--font-display);
		font-size: 2.25rem;
		font-weight: 800;
		line-height: 1;
		color: var(--deep);
	}

	/* The modifier as a roll button keeps its look; a small 🎲 hints it rolls. */
	.roll {
		padding: 0 var(--space-2);
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		cursor: pointer;
	}

	.roll::after {
		content: ' 🎲';
		font-size: 0.875rem;
		vertical-align: middle;
		opacity: 0.6;
	}

	.roll:hover,
	.check:hover,
	.more:hover {
		background-color: color-mix(in srgb, var(--structural) 30%, transparent);
	}

	.score {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--muted);
	}

	.more {
		inline-size: 100%;
		min-block-size: 1.75rem;
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		color: var(--muted);
		font-size: 1rem;
		cursor: pointer;
	}

	.ability.expanded {
		border-top-color: var(--foreground);
	}

	/* The open stat's save and skills, across the full width under the tiles. */
	.panel {
		grid-column: 1 / -1;
		display: grid;
		gap: var(--space-2);
		padding: var(--space-3);
		background-color: var(--raised);
		border-radius: var(--radius-m);
		box-shadow: var(--shadow);
	}

	.panel h3 {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}

	.checks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: var(--space-2);
	}

	.check {
		inline-size: 100%;
		min-block-size: 2.75rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-2);
		border: 1px solid var(--structural);
		border-radius: var(--radius-m);
		background: none;
		color: inherit;
		font-size: 0.8125rem;
		text-align: start;
		cursor: pointer;
	}

	.check.proficient,
	.check.save {
		font-weight: 800;
	}

	.bonus {
		font-weight: 800;
		color: var(--deep);
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
