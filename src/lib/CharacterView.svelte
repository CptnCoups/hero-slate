<script lang="ts">
	import type { GetCharacterResult } from '$lib/data/provider';
	import type { JsonValue, StateStore } from '$lib/state/store';
	import { formatIdentity } from '$lib/format';
	import { resolvePalette } from '$lib/theme/resolve';
	import AbilitiesBlock from '$lib/character/AbilitiesBlock.svelte';
	import CombatBlock from '$lib/character/CombatBlock.svelte';
	import HitPointsBlock from '$lib/character/HitPointsBlock.svelte';
	import ResourcePoolsBlock from '$lib/character/ResourcePoolsBlock.svelte';
	import SectionsBlock from '$lib/character/SectionsBlock.svelte';
	import LinksBlock from '$lib/character/LinksBlock.svelte';
	import { resolveAbilities } from '$lib/character/abilities';
	import { resolveCombat } from '$lib/character/combat';
	import { resolveHitPoints } from '$lib/character/hitPoints';
	import { resolvePools } from '$lib/character/pools';
	import { PoolCounts } from '$lib/character/poolCounts.svelte';
	import { resolveLinks } from '$lib/character/links';
	import AppHeader from '$lib/AppHeader.svelte';
	import DiceTray from '$lib/dice/DiceTray.svelte';
	import SheetSearch from '$lib/SheetSearch.svelte';
	import Collapsible from '$lib/Collapsible.svelte';

	type ViewState = GetCharacterResult | { status: 'loading' };

	// The route resolves the character and the "hp" state, then passes both here.
	// `storedHp`, `store`, and `id` support the tracker; a character with no hit
	// points to track renders none, so they are optional for state-free callers.
	let {
		result,
		storedHp = undefined,
		storedPools = undefined,
		store = undefined,
		id = ''
	}: { result: ViewState; storedHp?: JsonValue | undefined; storedPools?: JsonValue | undefined; store?: StateStore; id?: string } =
		$props();

	const character = $derived(result.status === 'found' ? result.character : null);

	// A group heading renders only when a block in its group renders, so each
	// check uses the same resolver its block uses to decide whether to render.
	const hasStats = $derived(
		character !== null &&
			(resolveAbilities(character.abilities).length > 0 || resolveCombat(character.combat).length > 0)
	);
	const hasSenses = $derived(character !== null && resolveCombat(character.senses).length > 0);
	const hasHealth = $derived(character !== null && resolveHitPoints(character.hitPoints, storedHp) !== null);
	const hasPools = $derived(character !== null && resolvePools(character.pools, storedPools).length > 0);
	// One set of pool counts for the dots and the spell breakout, so a cast
	// updates the dots.
	const counts = $derived(
		character !== null ? new PoolCounts(resolvePools(character.pools, storedPools), store, id) : undefined
	);
	const hasLinks = $derived(
		character !== null && resolveLinks(character.links, resolvePalette(character.color)).length > 0
	);
</script>

{#if result.status === 'loading'}
	<p>Loading…</p>
{:else if result.status === 'found'}
	<!-- The sheet root carries the resolved palette; the CSS maps it to a single
	     --accent / --on-accent for the active light or dark mode. -->
	<article data-palette={resolvePalette(result.character.color)}>
		<SheetSearch character={result.character} />
		<AppHeader
			title={result.character.name}
			subtitle={formatIdentity(result.character) || undefined}
			palette={resolvePalette(result.character.color)}
		/>
		<!-- Blocks render in one fixed order: stats, hit points, pools, the
		     authored sections, then the links. Each group heading sits directly
		     before its blocks. -->
		{#if hasStats}
			<Collapsible title="Stats">
				<AbilitiesBlock abilities={result.character.abilities} />
				<CombatBlock combat={result.character.combat} palette={result.character.color} />
			</Collapsible>
		{/if}
		{#if hasSenses}
			<Collapsible title="Senses">
				<CombatBlock combat={result.character.senses} palette={result.character.color} name="Senses" block="senses" />
			</Collapsible>
		{/if}
		{#if hasHealth}
			<Collapsible title="Health">
				<HitPointsBlock
					hitPoints={result.character.hitPoints}
					storedCurrent={storedHp}
					{store}
					{id}
				/>
			</Collapsible>
		{/if}
		{#if hasPools}
			<Collapsible title="Pools">
				<ResourcePoolsBlock pools={result.character.pools} {storedPools} {store} {id} shared={counts} />
			</Collapsible>
		{/if}
		<SectionsBlock sections={result.character.sections} spells={result.character.spells} {counts} />
		{#if hasLinks}
			<Collapsible title="Links">
				<LinksBlock links={result.character.links} palette={resolvePalette(result.character.color)} />
			</Collapsible>
		{/if}
		<DiceTray />
	</article>
{:else if result.status === 'error'}
	<p>Could not load this character. Try again.</p>
{:else}
	<!-- not-found and invalid share a fixed, id-free message. -->
	<p>Character not found</p>
{/if}

<style>
	article {
		display: grid;
		gap: var(--space-5);
	}

</style>
