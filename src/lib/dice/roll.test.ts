import { describe, expect, it } from 'vitest';
import { isRollable, parseExpression, roll } from './roll';

/** An rng that returns the given die faces in order, for a die of `sides`. */
function faces(sides: number[], values: number[]) {
	let i = 0;
	return () => {
		const value = values[i];
		const s = sides[Math.min(i, sides.length - 1)];
		i++;
		return (value - 1) / s + 1e-9;
	};
}

describe('parseExpression', () => {
	it('reads the pill formats the sheets use', () => {
		expect(parseExpression('d20+8')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: 8 });
		expect(parseExpression('1d8+5')).toEqual({ terms: [{ count: 1, sides: 8 }], modifier: 5 });
		expect(parseExpression('2d8 + 5')).toEqual({ terms: [{ count: 2, sides: 8 }], modifier: 5 });
		expect(parseExpression('2d10')).toEqual({ terms: [{ count: 2, sides: 10 }], modifier: 0 });
		expect(parseExpression('+d4')).toEqual({ terms: [{ count: 1, sides: 4 }], modifier: 0 });
		expect(parseExpression('d20-1')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: -1 });
	});

	it('treats a bare bonus as a d20 check', () => {
		expect(parseExpression('+8')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: 8 });
		expect(parseExpression('-1')).toEqual({ terms: [{ count: 1, sides: 20 }], modifier: -1 });
	});

	it('rejects things that are not rolls', () => {
		for (const text of ['DC 14', 'DC16 Con', '', '2d7', '0d6', 'd20+x', '-d6', '500d6']) {
			expect(isRollable(text), text).toBe(false);
		}
	});
});

describe('roll', () => {
	it('adds the dice and the modifier', () => {
		const result = roll('2d8+3', { rng: faces([8], [4, 7]) })!;
		expect(result.dice.map((d) => d.value)).toEqual([4, 7]);
		expect(result.total).toBe(14);
		expect(result.critical).toBe(false);
	});

	it('keeps the higher d20 with advantage and the lower with disadvantage', () => {
		const adv = roll('d20+8', { mode: 'advantage', rng: faces([20], [5, 17]) })!;
		expect(adv.dice).toEqual([
			{ sides: 20, value: 5, kept: false },
			{ sides: 20, value: 17, kept: true }
		]);
		expect(adv.total).toBe(25);

		const dis = roll('d20+8', { mode: 'disadvantage', rng: faces([20], [5, 17]) })!;
		expect(dis.total).toBe(13);
	});

	it('calls out a natural 20 and a natural 1 on a check', () => {
		expect(roll('d20+8', { rng: faces([20], [20]) })!.critical).toBe(true);
		expect(roll('d20+8', { rng: faces([20], [1]) })!.fumble).toBe(true);
		// A d20 rolled with advantage is a natural 20 only if the kept die is.
		expect(roll('d20', { mode: 'advantage', rng: faces([20], [20, 3]) })!.critical).toBe(true);
		expect(roll('d20', { mode: 'disadvantage', rng: faces([20], [20, 3]) })!.critical).toBe(false);
	});

	it('doubles the damage dice, not the modifier, on a crit', () => {
		const result = roll('1d8+5', { crit: true, rng: faces([8], [3, 6]) })!;
		expect(result.dice).toHaveLength(2);
		expect(result.total).toBe(14);
		expect(result.expression).toBe('2d8 + 5');
	});

	it('ignores advantage and crit where they do not apply', () => {
		expect(roll('2d6', { mode: 'advantage', rng: faces([6], [2, 3]) })!.dice).toHaveLength(2);
		expect(roll('d20+8', { crit: true, rng: faces([20], [10]) })!.dice).toHaveLength(1);
	});

	it('returns null for a non-roll', () => {
		expect(roll('DC 14')).toBeNull();
	});
});
