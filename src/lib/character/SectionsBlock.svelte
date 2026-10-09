<script lang="ts">
	import { resolveSections } from './sections';
	import RichText from '$lib/richtext/RichText.svelte';
	import { parse } from '$lib/richtext/parse';
	import SpellBreakout from './SpellBreakout.svelte';
	import type { PoolCounts } from './poolCounts.svelte';
	import { resolveSpells } from './spells';
	import { setCollapsed, sheetUi, slug } from '$lib/sheetUi.svelte';

	let { sections, spells = undefined, counts = undefined }: { sections: unknown; spells?: unknown; counts?: PoolCounts } =
		$props();

	const resolved = $derived(resolveSections(sections));
	const castable = $derived(resolveSpells(spells));
</script>

{#if resolved.length > 0}
	<div class="sections" data-block="sections">
		{#each resolved as section}
			{@const key = `section-${slug(section.title)}`}
			{@const folded = sheetUi.collapsed[key] === true}
			<section data-palette={section.palette} id={key} data-collapse-key={key}>
				<h2 class="section-heading">
					<button type="button" class="fold" aria-expanded={!folded} onclick={() => setCollapsed(key, !folded)}>
						{section.title}
					</button>
				</h2>
				<ul class="rows" hidden={folded}>
					{#each section.rows as row}
						{#if row.breakout === 'spells' && castable.length > 0}
							<li class="breakout" data-palette={row.palette} id={`row-${slug(section.title)}-${slug(row.title ?? row.body)}`}>
								<!-- Only the title toggles: the body holds roll buttons, which
								     can't sit inside another button. -->
								<div class="row">
									<button type="button" class="row-title toggle" aria-expanded={sheetUi.spellsOpen} onclick={() => (sheetUi.spellsOpen = !sheetUi.spellsOpen)}>
										{row.title ?? 'Spells'} <span class="chevron" aria-hidden="true">{sheetUi.spellsOpen ? '▴' : '▾'}</span>
									</button>
									<span class="row-body">
										<RichText nodes={parse(row.body)} label={row.title} />
									</span>
								</div>
								{#if sheetUi.spellsOpen}
									<SpellBreakout spells={castable} {counts} />
								{/if}
							</li>
						{:else}
							<li class="row" data-palette={row.palette} id={`row-${slug(section.title)}-${slug(row.title ?? row.body)}`}>
								{#if row.title}
									<span class="row-title">{row.title}</span>
								{/if}
								<span class="row-body">
									<RichText nodes={parse(row.body)} label={row.title} />
								</span>
							</li>
						{/if}
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.sections {
		display: grid;
		gap: var(--space-5);
	}

	/* A raised card whose top is the accent title strip. */
	section {
		background-color: var(--raised);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.section-heading {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background-color: var(--tint);
		color: var(--deep);
	}

	/* The whole title strip folds the section; the chevron is drawn, not text. */
	.fold {
		inline-size: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-4);
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		text-align: start;
		cursor: pointer;
	}

	.fold::after {
		content: '▾';
	}

	.fold[aria-expanded='false']::after {
		content: '▸';
	}

	.fold:focus-visible {
		outline: 3px solid var(--deep);
		outline-offset: -3px;
	}

	.rows[hidden] {
		display: none;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: var(--space-3) var(--space-4) var(--space-4);
		display: grid;
		gap: var(--space-3);
	}

	/* On narrow screens a row stacks its title above its body. */
	.row {
		display: grid;
		gap: var(--space-1);
	}

	.row-title {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 800;
		line-height: 1.2;
		color: var(--deep);
	}

	.row-body {
		font-size: 1rem;
	}

	/* The Cast a Spell row: its title is the toggle, the list opens under it. */
	.breakout {
		display: grid;
		gap: var(--space-3);
	}

	/* Keeps .row-title's font; only strips the button chrome. */
	.toggle {
		padding: var(--space-1) var(--space-2);
		margin: calc(-1 * var(--space-1)) calc(-1 * var(--space-2));
		border: 0;
		border-radius: var(--radius-m, 0.5rem);
		background: none;
		text-align: start;
		cursor: pointer;
	}

	.toggle:hover {
		background-color: color-mix(in srgb, var(--tint) 25%, transparent);
	}

	.toggle:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}

	.chevron {
		color: var(--muted);
	}

	/* From about 30rem up, the title and body sit side by side. */
	@media (min-width: 30rem) {
		.row {
			grid-template-columns: 8rem 1fr;
			gap: var(--space-3);
			align-items: baseline;
		}

		/* A body-only row spans both tracks so its text starts at the title
		   gutter's left edge rather than auto-placing into the empty title
		   column. */
		.row-body:only-child {
			grid-column: 1 / -1;
		}
	}
</style>
