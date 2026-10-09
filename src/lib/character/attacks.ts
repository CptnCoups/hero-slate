/**
 * Attacks and other actions listed in an "Attack" breakout.
 *
 * Authored as a top-level `attacks` list of `{ title, body, pool? }`. `body` is
 * rich text, so its dice pills roll; `pool` optionally names a pool that the
 * attack spends one use of (such as Fire Breath's three a day).
 */

export interface ResolvedAttack {
	title: string;
	body: string;
	pool?: string;
}

export function resolveAttacks(attacks: unknown): ResolvedAttack[] {
	if (!Array.isArray(attacks)) return [];
	return attacks.flatMap((attack) => {
		if (typeof attack !== 'object' || attack === null || Array.isArray(attack)) return [];
		const { title, body, pool } = attack as Record<string, unknown>;
		if (typeof title !== 'string' || title.trim().length === 0) return [];
		const resolved: ResolvedAttack = { title, body: typeof body === 'string' ? body : '' };
		if (typeof pool === 'string' && pool.length > 0) resolved.pool = pool;
		return [resolved];
	});
}
