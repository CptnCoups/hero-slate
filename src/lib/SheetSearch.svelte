<script lang="ts">
	// Search across the sheet: actions and other section rows, spells, stats, saves,
	// skills, pools, combat, and senses. Picking a result opens whatever hides it
	// (the spell list, a stat's skills), then scrolls to it and flashes it.
	import { tick } from 'svelte';
	import type { Character } from '$lib/types';
	import { resolveAbilities } from '$lib/character/abilities';
	import { resolveCombat } from '$lib/character/combat';
	import { resolvePools } from '$lib/character/pools';
	import { resolveSections } from '$lib/character/sections';
	import { resolveSpells } from '$lib/character/spells';
	import { resolveAttacks } from '$lib/character/attacks';
	import { reveal, sheetUi, slug } from '$lib/sheetUi.svelte';
	import ModeToggle from '$lib/dice/ModeToggle.svelte';
	import DiceMenu from '$lib/dice/DiceMenu.svelte';

	let { character }: { character: Character } = $props();

	interface Item {
		kind: string;
		title: string;
		detail: string;
		id: string;
		before?: () => void;
	}

	// Rich-text markup out, pill text kept: "[[d20+8]] to hit" reads "d20+8 to hit".
	const plain = (text: string) => text.replace(/\[\[|\]\]|\*+|_/g, '');

	const items = $derived.by<Item[]>(() => {
		const list: Item[] = [];
		const abilities = resolveAbilities(character.abilities);
		for (const a of abilities) {
			list.push({ kind: 'Stat', title: a.label, detail: `${a.score ?? ''} ${a.modifier}`, id: `ability-${slug(a.label)}` });
			if (a.save) {
				list.push({
					kind: 'Save',
					title: `${a.label} save`,
					detail: a.save,
					id: `save-${slug(a.label)}`,
					before: () => (sheetUi.openAbility = a.label)
				});
			}
			for (const s of a.skills) {
				list.push({
					kind: 'Skill',
					title: s.name,
					detail: `${a.label} ${s.bonus}`,
					id: `skill-${slug(s.name)}`,
					before: () => (sheetUi.openAbility = a.label)
				});
			}
		}
		for (const c of resolveCombat(character.combat)) {
			list.push({ kind: 'Combat', title: c.label, detail: c.value, id: `combat-${slug(c.label)}` });
		}
		for (const s of resolveCombat(character.senses)) {
			list.push({ kind: 'Sense', title: s.label, detail: s.value, id: `senses-${slug(s.label)}` });
		}
		for (const p of resolvePools(character.pools, undefined)) {
			list.push({ kind: 'Pool', title: p.label, detail: `${p.max} uses`, id: `pool-${p.id}` });
		}
		for (const section of resolveSections(character.sections)) {
			for (const row of section.rows) {
				list.push({
					kind: section.title,
					title: row.title ?? plain(row.body).slice(0, 40),
					detail: plain(row.body),
					id: `row-${slug(section.title)}-${slug(row.title ?? row.body)}`
				});
			}
		}
		for (const attack of resolveAttacks(character.attacks)) {
			list.push({
				kind: 'Attack',
				title: attack.title,
				detail: plain(attack.body),
				id: `attack-${slug(attack.title)}`,
				before: () => (sheetUi.attacksOpen = true)
			});
		}
		for (const spell of resolveSpells(character.spells)) {
			list.push({
				kind: 'Spell',
				title: spell.title,
				detail: plain(spell.body),
				id: `spell-${slug(spell.title)}`,
				before: () => (sheetUi.spellsOpen = true)
			});
		}
		return list;
	});

	let query = $state('');
	let active = $state(0);

	const results = $derived.by(() => {
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);
		if (words.length === 0) return [];
		const scored = items.flatMap((item) => {
			const title = item.title.toLowerCase();
			const haystack = `${title} ${item.kind.toLowerCase()} ${item.detail.toLowerCase()}`;
			if (!words.every((w) => haystack.includes(w))) return [];
			// Title hits first, title starts best.
			const score = words.every((w) => title.includes(w)) ? (title.startsWith(words[0]) ? 0 : 1) : 2;
			return [{ item, score }];
		});
		return scored.sort((a, b) => a.score - b.score).slice(0, 8).map((s) => s.item);
	});

	async function pick(item: Item): Promise<void> {
		item.before?.();
		query = '';
		await tick();
		reveal(item.id);
	}

	function onKey(event: KeyboardEvent): void {
		if (event.key === 'ArrowDown') {
			active = Math.min(active + 1, results.length - 1);
			event.preventDefault();
		} else if (event.key === 'ArrowUp') {
			active = Math.max(active - 1, 0);
			event.preventDefault();
		} else if (event.key === 'Enter' && results[active]) {
			pick(results[active]);
		} else if (event.key === 'Escape') {
			query = '';
		}
	}

	// A new query starts at the top result.
	$effect(() => {
		void query;
		active = 0;
	});
</script>

<div class="search" data-block="search">
	<div class="line">
		<input
			type="search"
			placeholder="🔍 Search spells, skills, actions…"
			aria-label="Search the sheet"
			aria-controls="sheet-search-results"
			autocomplete="off"
			bind:value={query}
			onkeydown={onKey}
		/>
		<ModeToggle />
		<DiceMenu />
	</div>
	{#if query.trim()}
		<ul id="sheet-search-results" class="results" role="listbox" aria-label="Search results">
			{#each results as item, i (item.id + item.kind)}
				<li role="option" aria-selected={i === active}>
					<button type="button" onclick={() => pick(item)} onmouseenter={() => (active = i)}>
						<span class="kind">{item.kind}</span>
						<span class="title">{item.title}</span>
						<span class="detail">{item.detail}</span>
					</button>
				</li>
			{:else}
				<li class="empty">Nothing found</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search {
		position: sticky;
		top: var(--space-2);
		z-index: 20;
	}

	/* The search box fills the line; the roll mode sits at its right end. */
	.line {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	input {
		flex: 1;
		min-inline-size: 0;
		min-block-size: 2.75rem;
		padding: 0 var(--space-4);
		border: 2px solid var(--structural);
		border-radius: 999px;
		background-color: var(--raised);
		color: inherit;
		font: inherit;
		box-shadow: var(--shadow);
	}

	input:focus {
		outline: none;
		border-color: var(--foreground);
	}

	.results {
		position: absolute;
		inset-inline: 0;
		top: calc(100% + var(--space-1));
		list-style: none;
		margin: 0;
		padding: var(--space-1);
		background-color: var(--raised);
		border-radius: var(--radius-l);
		box-shadow: var(--shadow), 0 8px 24px rgb(0 0 0 / 0.3);
		max-block-size: 60vh;
		overflow-y: auto;
	}

	.results button {
		inline-size: 100%;
		display: grid;
		grid-template-columns: 5.5rem auto 1fr;
		align-items: baseline;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: pointer;
	}

	[aria-selected='true'] button {
		background-color: color-mix(in srgb, var(--structural) 35%, transparent);
	}

	.kind {
		font-size: 0.6875rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.title {
		font-weight: 800;
		white-space: nowrap;
	}

	.detail {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--muted);
		font-size: 0.875rem;
	}

	.empty {
		padding: var(--space-2) var(--space-3);
		color: var(--muted);
	}
</style>
