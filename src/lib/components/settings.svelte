<script lang="ts">
import Settings from "@lucide/svelte/icons/settings";
import SquareArrowOutUpRight from "@lucide/svelte/icons/square-arrow-out-up-right";
import Trash from "@lucide/svelte/icons/trash";
import { Button, buttonVariants } from "$lib/components/ui/button";
import * as Dialog from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { config } from "$lib/config.svelte";

let input = $state("");
let open = $state(false);

async function handleSubmit() {
	config.save(input);
	open = false;
}

$effect(() => {
	open = !config.isConfigured;
});
</script>

<Dialog.Root bind:open>
	<form>
		<Dialog.Trigger class={buttonVariants({ variant: "ghost", size: "icon" })}>
			<Settings />
		</Dialog.Trigger>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Settings</Dialog.Title>
			</Dialog.Header>

			<div class="grid gap-4">
				<div class="grid gap-2">
					<Label>
						OpenRouter API Key
						<Button
							class="text-muted-foreground"
							variant="ghost"
							size="icon-sm"
							href="https://openrouter.ai/settings/keys"
							target="_blank"
						>
							<SquareArrowOutUpRight />
						</Button>
					</Label>
					<div class="flex gap-2 items-center">
						<Input
							type="password"
							bind:value={input}
							name="apiKey"
							placeholder="sk-or-*******************************************************************"
							onkeydown={async (e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									await handleSubmit();
								}
							}}
						/>
						<Button
							variant="destructive"
							size="icon-sm"
							onclick={() => config.clear()}
							hidden={!config.apiKey}
						>
							<Trash />
						</Button>
					</div>
				</div>
			</div>

			<Dialog.Footer>
				<Dialog.Close class={buttonVariants({ variant: "outline" })}>
					Cancel
				</Dialog.Close>
				<Button type="submit" onclick={handleSubmit}>Save settings</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</form>
</Dialog.Root>
