import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ModeToggle from './ModeToggle.svelte';
import DiceMenu from './DiceMenu.svelte';
import RichText from '$lib/richtext/RichText.svelte';
import { parse } from '$lib/richtext/parse';
import { Roller, roller } from './roller.svelte';

describe('Roller', () => {
	it('keeps the newest ten rolls, newest first', () => {
		const dice = new Roller(() => {});
		for (let i = 0; i < 12; i++) dice.roll('d6', `roll ${i}`);
		expect(dice.history).toHaveLength(10);
		expect(dice.latest?.label).toBe('roll 11');
	});

	it('plays the critical sound on a natural 20 unless muted', () => {
		const sound = vi.fn();
		const dice = new Roller(sound);
		const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);

		dice.roll('d20+3');
		expect(sound).toHaveBeenCalledTimes(1);

		dice.setMuted(true);
		dice.roll('d20+3');
		expect(sound).toHaveBeenCalledTimes(1);
		random.mockRestore();
	});
});

describe('Roller: fumble sound', () => {
	it('plays the wa-wa sound on a natural 1, not the critical one', () => {
		const critical = vi.fn();
		const fumble = vi.fn();
		const dice = new Roller(critical, fumble);
		// An earlier test leaves the device's mute switch on.
		dice.setMuted(false);
		const random = vi.spyOn(Math, 'random').mockReturnValue(0);

		dice.roll('d20+3');
		expect(fumble).toHaveBeenCalledTimes(1);
		expect(critical).not.toHaveBeenCalled();

		// A 1 on a damage die is not a fumble.
		dice.roll('1d8');
		expect(fumble).toHaveBeenCalledTimes(1);
		random.mockRestore();
	});
});

describe('DiceMenu', () => {
	it('pops the latest roll out under the dice button, with a CRITICAL! callout', async () => {
		const dice = new Roller(() => {});
		const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
		render(DiceMenu, { props: { dice } });

		await fireEvent.click(screen.getByRole('button', { name: 'Dice tray' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Roll a d20' }));

		expect(document.querySelector('[data-roll-total]')?.textContent).toBe('20');
		expect(screen.getByText('CRITICAL!')).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Dice tray' }));
		expect(screen.getByRole('button', { name: 'Close roll result' }).textContent).toContain('CRITICAL!');
		await fireEvent.click(screen.getByRole('button', { name: 'Close roll result' }));
		expect(screen.queryByRole('button', { name: 'Close roll result' })).toBeNull();
		random.mockRestore();
	});

	it('switches to advantage from the compact toggle', async () => {
		const dice = new Roller(() => {}, () => {});
		render(ModeToggle, { props: { dice } });
		await fireEvent.click(screen.getByRole('radio', { name: 'Advantage' }));
		expect(dice.mode).toBe('advantage');
	});
});

describe('rollable pills', () => {
	it('rolls a dice pill and leaves a DC pill as text', async () => {
		roller.clear();
		render(RichText, { props: { nodes: parse('[[d20+8]] to hit, save [[DC 14]]'), label: 'Warhammer' } });

		await fireEvent.click(screen.getByRole('button', { name: 'Roll d20+8 for Warhammer' }));
		expect(roller.latest?.label).toBe('Warhammer');
		expect(roller.latest?.modifier).toBe(8);
		expect(screen.queryByRole('button', { name: /DC 14/ })).toBeNull();
	});
});
