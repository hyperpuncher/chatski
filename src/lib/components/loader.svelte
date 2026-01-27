<script lang="ts">
let { isThinking } = $props();

const length = 18;
const interval = 50;
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
	const activeIntervals:
		| ReturnType<typeof setInterval>
		| ReturnType<typeof setTimeout>[] = [];

	for (let i = 0; i < length; i++) {
		const initialDelay = Math.random() * interval;

		const setupTimeout = setTimeout(() => {
			const id = setInterval(() => {
				displayText[i] = getRandomChar();
			}, interval);
			activeIntervals.push(id);
		}, initialDelay);

		activeIntervals.push(setupTimeout);
	}
	return () => {
		activeIntervals.forEach((id) => clearInterval(id));
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
