<script lang="ts">
import { Chat } from "@ai-sdk/svelte";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Paperclip from "@lucide/svelte/icons/paperclip";
import { slide } from "svelte/transition";
import * as InputGroup from "$lib/components/ui/input-group";

let input = "";
const chat = new Chat({});

function handleSubmit(event: SubmitEvent) {
	event.preventDefault();
	chat.sendMessage({ text: input });
	input = "";
}
</script>

<div class="flex flex-col justify-center items-center mx-auto max-w-3xl h-full">
	{#if chat.messages.length}
		<ul class="mt-20 space-y-8 w-full h-full text-lg" transition:slide>
			{#each chat.messages as message, messageIndex (messageIndex)}
				<li class="w-full">
					{#each message.parts as part, partIndex (partIndex)}
						{#if part.type === "text"}
							<p
								class={message.role === "user"
									? "ms-auto w-fit rounded-2xl bg-primary px-3 py-2 text-primary-foreground"
									: "leading-7.5"}
							>
								{part.text}
							</p>
						{/if}
					{/each}
				</li>
			{/each}
		</ul>
	{/if}

	<form class="sticky bottom-4 w-full" onsubmit={handleSubmit}>
		<InputGroup.Root
			class="py-1 px-2 rounded-3xl bg-muted/85 backdrop-blur-md dark:bg-muted/85"
		>
			<InputGroup.Textarea
				bind:value={input}
				class="md:text-lg"
				placeholder="Ask anything..."
			/>

			<InputGroup.Addon align="block-end">
				<InputGroup.Button variant="ghost" class="rounded-full" size="icon-sm">
					<Paperclip />
				</InputGroup.Button>

				<InputGroup.Button
					variant="default"
					class="rounded-full ms-auto"
					size="icon-sm"
					type="submit"
				>
					<ArrowUp />
				</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
	</form>
</div>
