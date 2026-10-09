import { roll, type Mode, type RollResult } from './roll';
import { playCritical } from './sound';

export interface LoggedRoll extends RollResult {
	id: number;
	label?: string;
}

const HISTORY = 10;
const MUTE_KEY = 'hero-slate:dice-muted';

function readMuted(): boolean {
	try {
		return globalThis.localStorage?.getItem(MUTE_KEY) === '1';
	} catch {
		return false;
	}
}

/**
 * The sheet's one dice roller: the current mode and crit toggles, the recent
 * rolls (newest first), and the mute switch, which this device remembers.
 */
export class Roller {
	mode = $state<Mode>('normal');
	crit = $state(false);
	muted = $state(readMuted());
	history = $state<LoggedRoll[]>([]);
	#next = 1;
	#sound: () => void;

	constructor(sound: () => void = playCritical) {
		this.#sound = sound;
	}

	get latest(): LoggedRoll | undefined {
		return this.history[0];
	}

	roll(text: string, label?: string): LoggedRoll | null {
		const result = roll(text, { mode: this.mode, crit: this.crit });
		if (!result) return null;
		const logged: LoggedRoll = { ...result, id: this.#next++, label };
		this.history = [logged, ...this.history].slice(0, HISTORY);
		if (result.critical && !this.muted) this.#sound();
		return logged;
	}

	setMuted(muted: boolean): void {
		this.muted = muted;
		try {
			globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0');
		} catch {
			// The switch still works for this visit.
		}
	}

	clear(): void {
		this.history = [];
	}
}

export const roller = new Roller();
