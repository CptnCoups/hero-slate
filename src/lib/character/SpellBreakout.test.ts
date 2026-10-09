import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CharacterView from '$lib/CharacterView.svelte';
import type { StateStore } from '$lib/state/store';

function store(): StateStore & { write: ReturnType<typeof vi.fn> } {
	return { read: vi.fn().mockResolvedValue(undefined), write: vi.fn().mockResolvedValue(undefined) };
}

const character = {
	id: 'gimdak',
	name: 'Gimdak',
	pools: [
		{ id: 'slots-1', label: 'Spell Slots (1st)', max: 2 },
		{ id: 'slots-2', label: 'Spell Slots (2nd)', max: 1 },
		{ id: 'divine-smite', label: 'Free Divine Smite', max: 1 }
	],
	sections: [
		{
			title: 'Action',
			rows: [{ title: 'Cast a Spell', body: 'Tap to pick a spell', breakout: 'spells' }]
		}
	],
	spells: [
		{ title: 'Bless', level: 1, body: 'Help friends' },
		{ title: 'Aid', level: 2, body: 'Extra hit points' },
		{ title: 'Divine Smite', level: 1, free: 'divine-smite', body: 'Holy damage' }
	]
};

function renderSheet(state = store()) {
	render(CharacterView, { props: { result: { status: 'found', character }, storedPools: undefined, store: state, id: 'gimdak' } });
	return state;
}

describe('Cast a Spell breakout', () => {
	it('opens the spell list from the Cast a Spell row', async () => {
		renderSheet();
		expect(screen.queryByText('Bless')).toBeNull();

		const toggle = screen.getByRole('button', { name: /Cast a Spell/ });
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		await fireEvent.click(toggle);

		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByText('Bless')).toBeTruthy();
		expect(screen.getByRole('button', { name: /Cast Aid using Spell Slots \(2nd\)/ })).toBeTruthy();
		expect(screen.queryByRole('button', { name: /Cast Aid using Spell Slots \(1st\)/ })).toBeNull();
	});

	it('spends the chosen slot and updates the pool dots', async () => {
		const state = renderSheet();
		await fireEvent.click(screen.getByRole('button', { name: /Cast a Spell/ }));
		state.write.mockClear();

		await fireEvent.click(screen.getByRole('button', { name: /Cast Bless using Spell Slots \(2nd\)/ }));

		expect(state.write).toHaveBeenLastCalledWith('gimdak', 'pools', { 'slots-1': 2, 'slots-2': 0, 'divine-smite': 1 });
		expect(screen.getByRole('button', { name: 'Spell Slots (2nd): 1 remaining' }).getAttribute('data-pool-dot')).toBe(
			'empty'
		);
	});

	it('disables a slot button once its pool is empty', async () => {
		renderSheet();
		await fireEvent.click(screen.getByRole('button', { name: /Cast a Spell/ }));

		const free = screen.getByRole('button', { name: /Cast Divine Smite using Free Divine Smite \(1 left\)/ });
		await fireEvent.click(free);

		expect(screen.getByRole('button', { name: /Cast Divine Smite using Free Divine Smite \(0 left\)/ })).toHaveProperty(
			'disabled',
			true
		);
	});

	it('shows a plain row when the sheet has no spells', () => {
		render(CharacterView, {
			props: { result: { status: 'found', character: { ...character, spells: undefined } }, store: store(), id: 'gimdak' }
		});
		expect(screen.queryByRole('button', { name: /Cast a Spell/ })).toBeNull();
		expect(screen.getByText('Cast a Spell')).toBeTruthy();
	});
});
