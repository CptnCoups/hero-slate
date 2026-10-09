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
	hitPoints: { max: 66, hitDie: 'd10+2' },
	pools: [
		{ id: 'slots-1', label: 'Spell Slots (1st)', max: 4 },
		{ id: 'channel', label: 'Channel Divinity', max: 2, shortRestRegain: 1 },
		{ id: 'second-wind', label: 'Second Wind', max: 1, reset: 'short' },
		{ id: 'hit-dice', label: 'Hit Dice', max: 7 }
	]
};

function renderSheet(storedHp: number, storedPools: Record<string, number>) {
	const state = store();
	render(CharacterView, {
		props: { result: { status: 'found', character }, storedHp, storedPools, store: state, id: 'gimdak' }
	});
	return state;
}

const remaining = (label: string) =>
	document.querySelector(`.dots[aria-label^="${label}:"]`)?.getAttribute('aria-label');

describe('Rest controls', () => {
	it('a long rest restores full hit points and every pool, after a second tap', async () => {
		const state = renderSheet(20, { 'slots-1': 0, channel: 0, 'hit-dice': 3 });

		await fireEvent.click(screen.getByRole('button', { name: '🏕️ Long Rest' }));
		expect(document.querySelector('.current')?.textContent).toBe('20');

		await fireEvent.click(screen.getByRole('button', { name: '🏕️ Tap again to rest' }));
		expect(document.querySelector('.current')?.textContent).toBe('66');
		expect(remaining('Spell Slots (1st)')).toBe('Spell Slots (1st): 4 remaining');
		expect(remaining('Hit Dice')).toBe('Hit Dice: 7 remaining');
		expect(state.write).toHaveBeenCalledWith('gimdak', 'hp', 66);
	});

	it('a short rest gives back one Channel Divinity and refills short-rest pools only', async () => {
		renderSheet(20, { 'slots-1': 0, channel: 0, 'second-wind': 0, 'hit-dice': 7 });

		await fireEvent.click(screen.getByRole('button', { name: '🌙 Short Rest' }));
		await fireEvent.click(screen.getByRole('button', { name: '✅ Finish short rest' }));

		expect(remaining('Channel Divinity')).toBe('Channel Divinity: 1 remaining');
		expect(remaining('Second Wind')).toBe('Second Wind: 1 remaining');
		expect(remaining('Spell Slots (1st)')).toBe('Spell Slots (1st): 0 remaining');
		expect(screen.getByText('Short rest done. Refilled: Channel Divinity +1, Second Wind +1.')).toBeTruthy();

		// Another short rest gives back the second use.
		await fireEvent.click(screen.getByRole('button', { name: '🌙 Short Rest' }));
		await fireEvent.click(screen.getByRole('button', { name: '✅ Finish short rest' }));
		expect(remaining('Channel Divinity')).toBe('Channel Divinity: 2 remaining');
	});

	it('spending a Hit Die heals by the roll and uses one die', async () => {
		const random = vi.spyOn(Math, 'random').mockReturnValue(0.55); // d10 → 6
		renderSheet(20, { 'hit-dice': 7 });

		await fireEvent.click(screen.getByRole('button', { name: '🌙 Short Rest' }));
		await fireEvent.click(screen.getByRole('button', { name: '🎲 Spend a Hit Die (7 left)' }));

		expect(document.querySelector('.current')?.textContent).toBe('28');
		expect(remaining('Hit Dice')).toBe('Hit Dice: 6 remaining');
		random.mockRestore();
	});
});

describe('Rows that spend a pool', () => {
	it('a Use button on a row spends one use from its pool', async () => {
		const { default: View } = await import('$lib/CharacterView.svelte');
		const state = store();
		render(View, {
			props: {
				result: {
					status: 'found',
					character: {
						id: 'gimdak',
						name: 'Gimdak',
						pools: [{ id: 'holy-power', label: 'Holy Power', max: 2 }],
						sections: [{ title: 'Bonus Action', rows: [{ title: 'Champion Challenge', body: 'Shout', pool: 'holy-power' }] }]
					}
				},
				store: state,
				id: 'gimdak'
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Use Champion Challenge from Holy Power (2 left)' }));
		expect(remaining('Holy Power')).toBe('Holy Power: 1 remaining');
		expect(state.write).toHaveBeenLastCalledWith('gimdak', 'pools', { 'holy-power': 1 });
	});
});
