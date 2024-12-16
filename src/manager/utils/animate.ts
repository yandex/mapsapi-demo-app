export function animate(cb: (progress: number) => void, duration: number) {
	const startTime = Date.now();

	function tick() {
		const progress = (Date.now() - startTime) / duration;

		if (progress >= 1) {
			cb(1);
			return;
		}

		cb(progress);
		requestAnimationFrame(tick);
	}

	requestAnimationFrame(tick);
}
