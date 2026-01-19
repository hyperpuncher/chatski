<script lang="ts">
import Settings from "@lucide/svelte/icons/settings";
import { Button, buttonVariants } from "$lib/components/ui/button";
import * as Dialog from "$lib/components/ui/dialog";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select";
import { config } from "$lib/config.svelte";
import { getLabs } from "$lib/remote/openrouter.remote";
import { isMobile } from "$lib/utils";

let open = $state(!config.settings.apiKey);

async function handleSubmit(e: Event) {
	e.preventDefault();
	config.save();
	open = false;
}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={buttonVariants({
			variant: isMobile.current ? "secondary" : "ghost",
			size: "icon",
		})}
	>
		<Settings />
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Settings</Dialog.Title>
		</Dialog.Header>

		<form onsubmit={handleSubmit}>
			<Field.Set>
				<Field.Group>
					<Field.Field>
						<Field.Label>OpenRouter API Key</Field.Label>
						<Input
							type="password"
							bind:value={config.settings.apiKey}
							required
							name="apiKey"
							placeholder="sk-or-***********************************************"
						/>
						<Field.Description>
							You can get your API key
							<a href="https://openrouter.ai/settings/keys" target="_blank"
								>here</a
							>.
						</Field.Description>
					</Field.Field>
				</Field.Group>

				<Field.Group>
					<Field.Field>
						<Field.Label>Select Labs</Field.Label>
						<Select.Root bind:value={config.settings.labs}>
							<Select.Trigger class="w-full">
								<Label class="truncate">
									{config.settings.labs.join(", ")}
								</Label>
							</Select.Trigger>
							<Select.Content class="overflow-y-scroll max-h-64">
								{#each await getLabs() as lab}
									<Select.Item value={lab}>{lab}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<div class="flex flex-col-reverse gap-2 mt-4 sm:flex-row sm:justify-end">
				<Button class="me-auto" variant="destructive" onclick={config.clear}>
					Reset
				</Button>
				<Dialog.Close class={buttonVariants({ variant: "outline" })}>
					Cancel
				</Dialog.Close>
				<Button type="submit">Save settings</Button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
