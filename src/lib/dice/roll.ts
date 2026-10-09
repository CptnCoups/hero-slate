/**
 * Dice expressions and rolls.
 *
 * An expression is one or more dice terms and an optional flat modifier, as the
 * sheet's pills write them: `d20+8`, `1d8+5`, `2d8 + 5`, `2d10`, `+d4`. A bare
 * bonus such as `+8` is a d20 check with that bonus. Anything else (`DC 14`)
 * is not a roll.
 */

export interface DiceTerm {
	count: number;
	sides: number;
}

export interface Expression {
	terms: DiceTerm[];
	modifier: number;
}

export type Mode = 'normal' | 'advantage' | 'disadvantage';

export interface DieResult {
	sides: number;
	value: number;
	/** False for the d20 dropped by advantage or disadvantage. */
	kept: boolean;
}

export interface RollResult {
	expression: string;
	dice: DieResult[];
	modifier: number;
	total: number;
	/** Set only for a single-d20 roll: the kept d20 came up 20 or 1. */
	critical: boolean;
	fumble: boolean;
	mode: Mode;
	crit: boolean;
}

const SIDES = new Set([2, 3, 4, 6, 8, 10, 12, 20, 100]);
const MAX_DICE = 100;

export function parseExpression(text: string): Expression | null {
	const compact = text.replace(/\s+/g, '').toLowerCase();
	if (compact.length === 0) return null;
	if (/^[+-]\d+$/.test(compact)) return { terms: [{ count: 1, sides: 20 }], modifier: Number(compact) };

	const parts = compact.match(/[+-]?[^+-]+/g);
	if (!parts || parts.join('') !== compact) return null;

	const terms: DiceTerm[] = [];
	let modifier = 0;
	for (const part of parts) {
		const sign = part.startsWith('-') ? -1 : 1;
		const body = part.replace(/^[+-]/, '');
		const die = /^(\d*)d(\d+)$/.exec(body);
		if (die) {
			if (sign < 0) return null;
			const count = die[1] === '' ? 1 : Number(die[1]);
			const sides = Number(die[2]);
			if (count < 1 || !SIDES.has(sides)) return null;
			terms.push({ count, sides });
		} else if (/^\d+$/.test(body)) {
			modifier += sign * Number(body);
		} else {
			return null;
		}
	}
	if (terms.length === 0 || terms.reduce((n, t) => n + t.count, 0) > MAX_DICE) return null;
	return { terms, modifier };
}

export function isRollable(text: string): boolean {
	return parseExpression(text) !== null;
}

/** A d20 check: exactly one d20 and nothing else. Advantage and crit callouts apply only to these. */
export function isCheck(expr: Expression): boolean {
	return expr.terms.length === 1 && expr.terms[0].count === 1 && expr.terms[0].sides === 20;
}

export function formatExpression(expr: Expression): string {
	const dice = expr.terms.map((t) => `${t.count}d${t.sides}`).join(' + ');
	if (expr.modifier === 0) return dice;
	return `${dice} ${expr.modifier > 0 ? '+' : '-'} ${Math.abs(expr.modifier)}`;
}

/** `rng` returns a float in [0, 1), like Math.random. */
export function roll(
	text: string,
	options: { mode?: Mode; crit?: boolean; rng?: () => number } = {}
): RollResult | null {
	const expr = parseExpression(text);
	if (!expr) return null;
	const rng = options.rng ?? Math.random;
	const die = (sides: number) => Math.floor(rng() * sides) + 1;
	const check = isCheck(expr);
	const mode: Mode = check ? (options.mode ?? 'normal') : 'normal';
	// A critical hit doubles the dice of a damage roll, never of a check.
	const crit = !check && options.crit === true;

	const dice: DieResult[] = [];
	if (check && mode !== 'normal') {
		const a = die(20);
		const b = die(20);
		const keepA = mode === 'advantage' ? a >= b : a <= b;
		dice.push({ sides: 20, value: a, kept: keepA }, { sides: 20, value: b, kept: !keepA });
	} else {
		for (const term of expr.terms) {
			const count = crit ? term.count * 2 : term.count;
			for (let i = 0; i < count; i++) dice.push({ sides: term.sides, value: die(term.sides), kept: true });
		}
	}

	const kept = dice.filter((d) => d.kept);
	const total = kept.reduce((sum, d) => sum + d.value, 0) + expr.modifier;
	const natural = check ? kept[0].value : 0;
	return {
		expression: formatExpression(crit ? { ...expr, terms: expr.terms.map((t) => ({ ...t, count: t.count * 2 })) } : expr),
		dice,
		modifier: expr.modifier,
		total,
		critical: natural === 20,
		fumble: check && natural === 1,
		mode,
		crit
	};
}
