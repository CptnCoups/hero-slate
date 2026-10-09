import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CharacterView from '$lib/CharacterView.svelte';
import { sheetUi } from '$lib/sheetUi.svelte';

const character = {
	id: 'gimdak',
	name: 'Gimdak',
	abilities: [
		{ label: 'Charisma', value: 16, save: '+9', skills: [{ name: 'Persuasion', bonus: 6, proficient: true }] }
	],
	senses: [{ label: 'Darkvision', value: '60 ft' }],
	pools: [{ id: 'slots-1', label: 'Spell Slots (1st)', max: 4 }],
	sections: [{ title: 'Action', rows: [{ title: 'Cast a Spell', body: 'Tap to pick', breakout: 'spells' }] }],
	spells: [{ title: 'Bless', level: 1, body: 'Help three friends' }]
};

function renderSheet() {
	render(CharacterView, { props: { result: { status: 'found', character }, id: 'gimdak' } });
	return screen.getByRole('searchbox', { name: 'Search the sheet' });
}

describe('SheetSearch', () => {
	beforeEach(() => {
		sheetUi.spellsOpen = false;
		sheetUi.openAbility = null;
		Element.prototype.scrollIntoView = vi.fn();
	});

	it('finds a hidden spell and opens the spell list to show it', async () => {
		const input = renderSheet();
		await fireEvent.input(input, { target: { value: 'bless' } });

		const result = screen.getByRole('option', { name: /Spell.*Bless/ });
		await fireEvent.click(result.querySelector('button')!);

		expect(sheetUi.spellsOpen).toBe(true);
		expect(document.getElementById('spell-bless')).toBeTruthy();
	});

	it('opens a stat to reach its skill', async () => {
		const input = renderSheet();
		await fireEvent.input(input, { target: { value: 'persu' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(sheetUi.openAbility).toBe('Charisma');
		expect(document.getElementById('skill-persuasion')).toBeTruthy();
	});

	it('finds saves and senses, and says when nothing matches', async () => {
		const input = renderSheet();
		await fireEvent.input(input, { target: { value: 'dark' } });
		expect(screen.getByRole('option', { name: /Sense.*Darkvision/ })).toBeTruthy();

		await fireEvent.input(input, { target: { value: 'charisma save' } });
		expect(screen.getByRole('option', { name: /Save.*Charisma save/ })).toBeTruthy();

		await fireEvent.input(input, { target: { value: 'zzzz' } });
		expect(screen.getByText('Nothing found')).toBeTruthy();
	});
});

describe('Saves and senses', () => {
	it('keeps saves in the stat dropdown, with no separate saves area, and shows the senses', async () => {
		sheetUi.openAbility = null;
		render(CharacterView, { props: { result: { status: 'found', character }, id: 'gimdak' } });
		expect(document.querySelector('[data-block="saves"]')).toBeNull();

		await fireEvent.click(screen.getByRole('button', { name: 'Charisma save and skills' }));
		expect(screen.getByRole('button', { name: 'Roll Charisma save, d20+9' })).toBeTruthy();
		expect(screen.getByRole('region', { name: 'Senses' }).textContent).toContain('60 ft');
	});
});
