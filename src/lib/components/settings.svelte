<script lang="ts">
import Settings from "@lucide/svelte/icons/settings";
import SquareArrowOutUpRight from "@lucide/svelte/icons/square-arrow-out-up-right";
import { Button, buttonVariants } from "$lib/components/ui/button";
import * as Dialog from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { localStorage } from "$lib/storage";

let input = $state("");
let open = $state(!(await localStorage.get<string>("apiKey")));

async function handleSubmit() {
	await localStorage.setItem("apiKey", input);
	open = false;
}
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
					<Input
						type="password"
						bind:value={input}
						name="apiKey"
						placeholder="sk-or-*******************************************************************"
					/>
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
