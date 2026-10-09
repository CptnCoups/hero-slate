import { describe, expect, it } from 'vitest';
import { castOptions, ordinal, resolveSpells } from './spells';

describe('resolveSpells', () => {
	it('keeps titled spells with an integer level and drops the rest', () => {
		expect(
			resolveSpells([
				{ title: 'Bless', level: 1, body: 'Help friends' },
				{ title: 'Smite', level: 1, free: 'divine-smite' },
				{ title: '', level: 1 },
				{ title: 'No level' },
				{ title: 'Fractional', level: 1.5 },
				'Fireball'
			])
		).toEqual([
			{ title: 'Bless', level: 1, body: 'Help friends' },
			{ title: 'Smite', level: 1, body: '', free: 'divine-smite' }
		]);
	});

	it('returns nothing for a missing or non-list value', () => {
		expect(resolveSpells(undefined)).toEqual([]);
		expect(resolveSpells({ title: 'Bless', level: 1 })).toEqual([]);
	});
});

describe('castOptions', () => {
	const pools = ['holy-power', 'slots-2', 'slots-1', 'divine-smite'];

	it('offers every slot at or above the spell level, lowest first', () => {
		expect(castOptions({ title: 'Bless', level: 1, body: '' }, pools)).toEqual([
			{ poolId: 'slots-1', label: '1st' },
			{ poolId: 'slots-2', label: '2nd' }
		]);
		expect(castOptions({ title: 'Aid', level: 2, body: '' }, pools)).toEqual([{ poolId: 'slots-2', label: '2nd' }]);
	});

	it('puts a free-cast pool first, when the character has it', () => {
		expect(castOptions({ title: 'Smite', level: 1, body: '', free: 'divine-smite' }, pools)[0]).toEqual({
			poolId: 'divine-smite',
			label: 'free'
		});
		expect(castOptions({ title: 'Steed', level: 2, body: '', free: 'missing' }, pools)).toEqual([
			{ poolId: 'slots-2', label: '2nd' }
		]);
	});

	it('gives a cantrip no slot buttons', () => {
		expect(castOptions({ title: 'Light', level: 0, body: '' }, pools)).toEqual([]);
	});
});

describe('ordinal', () => {
	it('names spell levels', () => {
		expect([1, 2, 3, 4, 9].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '9th']);
	});
});
