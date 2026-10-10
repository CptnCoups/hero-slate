/**
 * Spells a character can cast from the "Cast a Spell" breakout.
 *
 * Authored as a top-level `spells` list of `{ title, level, body, free? }`:
 * `level` is the spell level (0 for a cantrip), and `free` optionally names a
 * pool of free casts (such as one free Divine Smite a day). A spell can use any
 * spell-slot pool whose id is `slots-N` with `N` at or above its level. An
 * optional `url` (https only) links the spell's name to its full rules, such as
 * its D&D Beyond page.
 */

export interface ResolvedSpell {
	title: string;
	level: number;
	body: string;
	free?: string;
	url?: string;
	/** Other things the spell gives, each spending its own pool (the steed's Fey Step). */
	uses?: { label: string; pool: string }[];
}

/** An https link, or undefined — never a javascript: or other scheme. */
function httpsUrl(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' ? url.href : undefined;
	} catch {
		return undefined;
	}
}

export interface CastOption {
	poolId: string;
	label: string;
}

const SLOT_POOL = /^slots-(\d+)$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function resolveSpells(spells: unknown): ResolvedSpell[] {
	if (!Array.isArray(spells)) return [];
	return spells.flatMap((spell) => {
		if (!isPlainObject(spell)) return [];
		const { title, level, body, free, url, uses } = spell;
		if (typeof title !== 'string' || title.trim().length === 0) return [];
		if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > 9) return [];
		const resolved: ResolvedSpell = { title, level, body: typeof body === 'string' ? body : '' };
		if (typeof free === 'string' && free.length > 0) resolved.free = free;
		const link = httpsUrl(url);
		if (link) resolved.url = link;
		const extra = Array.isArray(uses)
			? uses.flatMap((use) =>
					isPlainObject(use) && typeof use.label === 'string' && use.label.trim() && typeof use.pool === 'string' && use.pool
						? [{ label: use.label, pool: use.pool }]
						: []
				)
			: [];
		if (extra.length > 0) resolved.uses = extra;
		return [resolved];
	});
}

export function ordinal(n: number): string {
	const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
	return `${n}${suffix}`;
}

/** The pools a spell can be cast from, free casts first, then slots from its level up. */
export function castOptions(spell: ResolvedSpell, poolIds: readonly string[]): CastOption[] {
	const options: CastOption[] = [];
	if (spell.free && poolIds.includes(spell.free)) options.push({ poolId: spell.free, label: 'free' });
	if (spell.level === 0) return options;
	const slots = poolIds
		.map((id) => ({ id, level: Number(SLOT_POOL.exec(id)?.[1]) }))
		.filter((slot) => Number.isInteger(slot.level) && slot.level >= spell.level)
		.sort((a, b) => a.level - b.level);
	for (const slot of slots) options.push({ poolId: slot.id, label: ordinal(slot.level) });
	return options;
}
