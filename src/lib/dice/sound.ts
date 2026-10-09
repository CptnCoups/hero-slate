/**
 * The natural-20 fanfare: a synthesized low boom and whoosh, then the browser's
 * own voice growling "Critical!". Everything is generated on the device — no
 * audio files. Fails silently where Web Audio or speech is unavailable.
 */
export function playCritical(): void {
	try {
		const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (Ctx) {
			const ctx = new Ctx();
			const now = ctx.currentTime;

			// A deep falling boom.
			const boom = ctx.createOscillator();
			const boomGain = ctx.createGain();
			boom.type = 'sawtooth';
			boom.frequency.setValueAtTime(140, now);
			boom.frequency.exponentialRampToValueAtTime(35, now + 0.9);
			boomGain.gain.setValueAtTime(0.0001, now);
			boomGain.gain.exponentialRampToValueAtTime(0.5, now + 0.03);
			boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
			boom.connect(boomGain).connect(ctx.destination);
			boom.start(now);
			boom.stop(now + 1.2);

			// A filtered noise whoosh over it.
			const length = Math.floor(ctx.sampleRate * 0.8);
			const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
			const noise = ctx.createBufferSource();
			const filter = ctx.createBiquadFilter();
			const noiseGain = ctx.createGain();
			noise.buffer = buffer;
			filter.type = 'bandpass';
			filter.frequency.setValueAtTime(2000, now);
			filter.frequency.exponentialRampToValueAtTime(300, now + 0.8);
			noiseGain.gain.value = 0.25;
			noise.connect(filter).connect(noiseGain).connect(ctx.destination);
			noise.start(now);

			setTimeout(() => ctx.close().catch(() => {}), 1500);
		}
	} catch {
		// No audio on this device.
	}

	try {
		if ('speechSynthesis' in window) {
			const shout = new SpeechSynthesisUtterance('Critical!');
			shout.pitch = 0.1;
			shout.rate = 0.75;
			shout.volume = 1;
			setTimeout(() => window.speechSynthesis.speak(shout), 250);
		}
	} catch {
		// No speech on this device.
	}
}

/**
 * The natural-1 "wa wa waaaa": a sad trombone of three falling notes and a long
 * wobbling last one, from a filtered sawtooth. Generated on the device.
 */
export function playFumble(): void {
	try {
		const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctx) return;
		const ctx = new Ctx();
		const start = ctx.currentTime + 0.05;

		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 1100;
		filter.Q.value = 4;
		const master = ctx.createGain();
		master.gain.value = 0.35;
		filter.connect(master).connect(ctx.destination);

		// Each note slides down a little at its end, like a trombone slide.
		const notes: { freq: number; at: number; length: number }[] = [
			{ freq: 293.66, at: 0, length: 0.4 },
			{ freq: 277.18, at: 0.45, length: 0.4 },
			{ freq: 261.63, at: 0.9, length: 0.4 },
			{ freq: 246.94, at: 1.35, length: 1.3 }
		];
		for (const [i, note] of notes.entries()) {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			const t = start + note.at;
			const last = i === notes.length - 1;
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(note.freq, t);
			osc.frequency.linearRampToValueAtTime(note.freq * (last ? 0.94 : 0.97), t + note.length);
			if (last) {
				// The "waaaa" wobble.
				const lfo = ctx.createOscillator();
				const depth = ctx.createGain();
				lfo.frequency.value = 6;
				depth.gain.value = 6;
				lfo.connect(depth).connect(osc.frequency);
				lfo.start(t);
				lfo.stop(t + note.length);
			}
			gain.gain.setValueAtTime(0.0001, t);
			gain.gain.exponentialRampToValueAtTime(1, t + 0.05);
			gain.gain.setValueAtTime(1, t + note.length - 0.12);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + note.length);
			osc.connect(gain).connect(filter);
			osc.start(t);
			osc.stop(t + note.length + 0.02);
		}
		setTimeout(() => ctx.close().catch(() => {}), 3200);
	} catch {
		// No audio on this device.
	}
}
