<script lang="ts">
let fps = $state(0);
const display = $derived(fps.toString().padStart(3, "\u00A0"));

$effect(() => {
	let frames = 0;
	let lastTime = performance.now();
	let raf: number;

	function loop(now: number) {
		frames++;
		const delta = now - lastTime;
		if (delta >= 1000) {
			fps = Math.round((frames * 1000) / delta);
			frames = 0;
			lastTime = now;
		}
		raf = requestAnimationFrame(loop);
	}

	raf = requestAnimationFrame(loop);
	return () => cancelAnimationFrame(raf);
});
</script>

<div
	class="pointer-events-none fixed top-5 left-15 z-9999 w-18 rounded-lg bg-muted py-1.5 text-center font-mono text-xs text-nowrap text-green-400"
>
	{display} FPS
</div>
