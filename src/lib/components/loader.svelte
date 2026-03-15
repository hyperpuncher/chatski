<script lang="ts">
const length = 18;
const interval = 60;
const chars =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

let displayText = $state(Array(length).fill(""));

function getRandomChar() {
	return chars[Math.floor(Math.random() * chars.length)];
}

for (let i = 0; i < length; i++) {
	displayText[i] = getRandomChar();
}

$effect(() => {
	const nextUpdate: number[] = [];
	const now = performance.now();

	for (let i = 0; i < length; i++) {
		nextUpdate[i] = now + Math.random() * interval;
	}

	let frame: number;

	const loop = (time: number) => {
		for (let i = 0; i < length; i++) {
			if (time >= nextUpdate[i]) {
				displayText[i] = getRandomChar();
				nextUpdate[i] += interval;
			}
		}
		frame = requestAnimationFrame(loop);
	};

	frame = requestAnimationFrame(loop);

	return () => {
		cancelAnimationFrame(frame);
	};
});
</script>

<span class="font-mono text-sm select-none">
	<span
		class="animate-gradient bg-linear-to-r from-neutral-700 via-neutral-100 to-neutral-700 mask-r-from-90% mask-l-from-90% bg-size-[200%] bg-clip-text text-transparent dark:from-neutral-300 dark:via-neutral-800 dark:to-neutral-300"
	>
		{displayText.join("")}
	</span>
</span>
