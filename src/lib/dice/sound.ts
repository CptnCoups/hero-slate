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
