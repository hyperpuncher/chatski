<script lang="ts">
let { isThinking } = $props();

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
		class="animate-gradient bg-linear-to-r/longer from-violet-400 via-[#DDFF84] to-violet-400 mask-r-from-90% mask-l-from-90% bg-size-[200%] bg-clip-text text-transparent dark:from-violet-300 dark:via-[#EFFFB4] dark:to-violet-300"
	>
		{displayText.join("")}
	</span>
	{#if isThinking}
		<span class="animate-in text-muted-foreground fade-in">Thinking...</span>
	{/if}
</span>
