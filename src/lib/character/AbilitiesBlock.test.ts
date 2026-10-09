import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AbilitiesBlock from './AbilitiesBlock.svelte';

describe('AbilitiesBlock', () => {
	it('renders entries in order, each with modifier and raw score as separate elements', () => {
		const { container } = render(AbilitiesBlock, {
			props: {
				abilities: [
					{ label: 'Strength', value: 10 },
					{ label: 'Dexterity', value: 14 },
					{ label: 'Wisdom', value: 18 }
				]
			}
		});

		const cells = container.querySelectorAll('.ability');
		expect(cells).toHaveLength(3);

		const modifiers = [...cells].map((cell) => cell.querySelector('.modifier')?.textContent);
		expect(modifiers).toEqual(['+0', '+2', '+4']);

		const scores = [...cells].map((cell) => cell.querySelector('.score')?.textContent);
		expect(scores).toEqual(['10', '14', '18']);

		// The modifier and the raw score are distinct elements within a cell.
		const firstCell = cells[0];
		const modifier = firstCell.querySelector('.modifier');
		const score = firstCell.querySelector('.score');
		expect(modifier).not.toBe(score);
		expect(modifier).toBeTruthy();
		expect(score).toBeTruthy();
	});

	it('shows no raw score when the value is not a finite number', () => {
		const { container } = render(AbilitiesBlock, {
			props: { abilities: [{ label: 'Strength', modifier: '+2' }] }
		});

		expect(container.querySelector('.modifier')?.textContent).toBe('+2');
		expect(container.querySelector('.score')).toBeNull();
	});

	it('renders nothing when the resolved list is empty', () => {
		const { container } = render(AbilitiesBlock, {
			props: { abilities: [null, 7, { value: 10 }] }
		});

		expect(container.querySelector('.abilities')).toBeNull();
		expect(container.querySelector('.ability')).toBeNull();
	});

	it('renders authored label and modifier text as text, not markup', () => {
		const { container } = render(AbilitiesBlock, {
			props: { abilities: [{ label: '<b>x</b>', value: 13, modifier: '<img src=x>' }] }
		});

		// The literal strings are shown as visible text.
		expect(screen.getByText('<b>x</b>')).toBeTruthy();
		expect(screen.getByText('<img src=x>')).toBeTruthy();

		// No corresponding HTML element was created from the authored strings.
		expect(container.querySelector('b')).toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});
});

describe('AbilitiesBlock: rolling', () => {
	it('rolls a check from the modifier and a skill from the dropdown', async () => {
		const { fireEvent } = await import('@testing-library/svelte');
		const { roller } = await import('$lib/dice/roller.svelte');
		roller.clear();
		render(AbilitiesBlock, {
			props: { abilities: [{ label: 'Strength', value: 20, skills: [{ name: 'Athletics', bonus: 8, proficient: true }] }] }
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Roll Strength check, d20+5' }));
		expect(roller.latest?.label).toBe('Strength check');
		expect(roller.latest?.modifier).toBe(5);

		expect(screen.queryByRole('button', { name: /Athletics/ })).toBeNull();
		await fireEvent.click(screen.getByRole('button', { name: 'Strength save and skills' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Roll Athletics, d20+8' }));
		expect(roller.latest?.label).toBe('Athletics');
		expect(roller.latest?.modifier).toBe(8);
	});

	it('shows no dropdown for a stat with no save or skills', () => {
		render(AbilitiesBlock, { props: { abilities: [{ label: 'Constitution', value: 14 }] } });
		expect(screen.queryByRole('button', { name: /save and skills/ })).toBeNull();
	});
});
