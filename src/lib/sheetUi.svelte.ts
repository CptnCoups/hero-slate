/**
 * What is open on the sheet: the Cast a Spell breakout and the stat whose save
 * and skills are showing. Shared so search can open them before jumping to a
 * spell or a skill.
 */
const COLLAPSED_KEY = 'hero-slate:collapsed';

function loadCollapsed(): Record<string, boolean> {
	try {
		const raw = globalThis.localStorage?.getItem(COLLAPSED_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : {};
		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, boolean>) : {};
	} catch {
		return {};
	}
}

export const sheetUi = $state({
	spellsOpen: false,
	openAbility: null as string | null,
	/** Collapsed areas by key ("group-stats", "section-action"); this device remembers them. */
	collapsed: loadCollapsed()
});

export function setCollapsed(key: string, collapsed: boolean): void {
	sheetUi.collapsed = { ...sheetUi.collapsed, [key]: collapsed };
	try {
		globalThis.localStorage?.setItem(COLLAPSED_KEY, JSON.stringify(sheetUi.collapsed));
	} catch {
		// Still works for this visit.
	}
}

/** An element id from free text: lowercase letters and digits joined by hyphens. */
export function slug(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Scroll to an element and flash it so the eye finds it. */
export function reveal(id: string): void {
	const el = document.getElementById(id);
	if (!el) return;
	// Open any collapsed area around it first; collapsed areas are hidden, not removed.
	for (let area = el.closest<HTMLElement>('[data-collapse-key]'); area; area = area.parentElement?.closest<HTMLElement>('[data-collapse-key]') ?? null) {
		const key = area.dataset.collapseKey;
		if (key && sheetUi.collapsed[key]) setCollapsed(key, false);
	}
	requestAnimationFrame(() => flash(el));
}

function flash(el: HTMLElement): void {
	el.scrollIntoView({ behavior: 'smooth', block: 'center' });
	el.classList.remove('search-flash');
	// Restart the animation even when the same element is picked twice.
	void el.offsetWidth;
	el.classList.add('search-flash');
	setTimeout(() => el.classList.remove('search-flash'), 1800);
}
