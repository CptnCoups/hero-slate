import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CharacterView from '$lib/CharacterView.svelte';
import type { StateStore } from '$lib/state/store';
import { sheetUi } from '$lib/sheetUi.svelte';
import { resolveAttacks } from './attacks';

function store(): StateStore & { write: ReturnType<typeof vi.fn> } {
	return { read: vi.fn().mockResolvedValue(undefined), write: vi.fn().mockResolvedValue(undefined) };
}

const character = {
	id: 'gimdak',
	name: 'Gimdak',
	pools: [{ id: 'fire-breath', label: 'Fire Breath', max: 1 }],
	sections: [{ title: 'Action', rows: [{ title: 'Attack', body: 'Tap to pick', breakout: 'attacks' }] }],
	attacks: [
		{ title: 'Warhammer', body: '[[d20+8]] to hit, [[1d8+5]] damage' },
		{ title: 'Javelin', body: '[[d20+8]] to hit, [[1d6+5]] damage' },
		{ title: 'Fire Breath', pool: 'fire-breath', body: '[[DC 13]] save, [[2d10]] damage' }
	]
};

describe('resolveAttacks', () => {
	it('keeps titled attacks and an optional pool', () => {
		expect(resolveAttacks([{ title: 'Hammer', body: 'Smash' }, { title: 'Breath', pool: 'fire' }, { body: 'no title' }, 7])).toEqual([
			{ title: 'Hammer', body: 'Smash' },
			{ title: 'Breath', body: '', pool: 'fire' }
		]);
	});
});

describe('Attack breakout', () => {
	beforeEach(() => {
		sheetUi.attacksOpen = false;
	});

	it('lists every attack with rollable pills', async () => {
		render(CharacterView, { props: { result: { status: 'found', character }, store: store(), id: 'gimdak' } });
		expect(screen.queryByText('Javelin')).toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: /^Attack/ }));
		expect(screen.getByText('Warhammer')).toBeTruthy();
		expect(screen.getByText('Javelin')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Roll 1d6+5 for Javelin' })).toBeTruthy();
	});

	it('spends a use from the attack pool and disables Use when empty', async () => {
		const state = store();
		render(CharacterView, { props: { result: { status: 'found', character }, store: state, id: 'gimdak' } });
		await fireEvent.click(screen.getByRole('button', { name: /^Attack/ }));

		await fireEvent.click(screen.getByRole('button', { name: 'Use Fire Breath from Fire Breath (1 left)' }));
		expect(state.write).toHaveBeenLastCalledWith('gimdak', 'pools', { 'fire-breath': 0 });
		expect(screen.getByRole('button', { name: 'Use Fire Breath from Fire Breath (0 left)' })).toHaveProperty('disabled', true);
	});
});
