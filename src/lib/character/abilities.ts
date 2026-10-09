/**
 * Resolve the loosely-typed `abilities` field into a render-ready list.
 *
 * Follows the domain-resolver pattern: coerce authored data, fall back safely,
 * never throw. Each valid entry (see `validEntries`) becomes a `ResolvedAbility`
 * with its label, a display modifier (computed or authored, see `abilityModifier`),
 * and its raw score — only when the authored `value` is a finite number, otherwise
 * `null`.
 *
 * An entry may also carry a saving throw bonus (`save`) and the `skills` that use
 * it, each `{ name, bonus, proficient? }`; the sheet lists them under the tile.
 */
import { validEntries } from './entries';
import { abilityModifier } from './modifier';

export interface ResolvedSkill {
	name: string;
	/** Signed, such as "+8". */
	bonus: string;
	proficient: boolean;
}

export interface ResolvedAbility {
	/** The authored label, rendered as text. */
	label: string;
	/** The display modifier: signed computed value, authored override, or "—". */
	modifier: string;
	/** The raw score when the authored value is a finite number; otherwise null. */
	score: number | null;
	/** The saving throw bonus, signed, when authored; otherwise null. */
	save: string | null;
	skills: ResolvedSkill[];
}

/** A signed bonus from an authored integer or a "+N"/"-N" string; null for anything else. */
export function signedBonus(value: unknown): string | null {
	if (typeof value === 'number' && Number.isInteger(value)) return value >= 0 ? `+${value}` : `${value}`;
	if (typeof value === 'string' && /^[+-]\d+$/.test(value.trim())) return value.trim();
	return null;
}

function resolveSkills(input: unknown): ResolvedSkill[] {
	if (!Array.isArray(input)) return [];
	return input.flatMap((skill) => {
		if (typeof skill !== 'object' || skill === null || Array.isArray(skill)) return [];
		const { name, bonus, proficient } = skill as Record<string, unknown>;
		const signed = signedBonus(bonus);
		if (typeof name !== 'string' || name.trim().length === 0 || signed === null) return [];
		return [{ name, bonus: signed, proficient: proficient === true }];
	});
}

/** Resolve `abilities` into an ordered list of render-ready entries. */
export function resolveAbilities(input: unknown): ResolvedAbility[] {
	return validEntries(input).map((entry) => ({
		label: entry.label,
		modifier: abilityModifier(entry.value, entry.modifier),
		score: typeof entry.value === 'number' && Number.isFinite(entry.value) ? entry.value : null,
		save: signedBonus(entry.save),
		skills: resolveSkills(entry.skills)
	}));
}
