<script lang="ts">
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import Pencil from "@lucide/svelte/icons/pencil";
import PlusIcon from "@lucide/svelte/icons/plus";
import Settings from "@lucide/svelte/icons/settings";
import Trash2 from "@lucide/svelte/icons/trash-2";
import { Button, buttonVariants } from "$lib/components/ui/button";
import * as Command from "$lib/components/ui/command/index.js";
import * as Dialog from "$lib/components/ui/dialog";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Popover from "$lib/components/ui/popover/index.js";
import * as Select from "$lib/components/ui/select";
import { Switch } from "$lib/components/ui/switch";
import * as Tabs from "$lib/components/ui/tabs/index.js";
import { config, type MCP } from "$lib/config.svelte";
import { getLabs, getModels } from "$lib/remote/openrouter.remote";
import { cn, isMobile } from "$lib/utils";

let open = $state(!config.settings.apiKey);
let isDefaultModelPopoverOpen = $state(false);
let isMCPInputOpen = $state(false);

async function handleSubmit(e: Event) {
	e.preventDefault();
	config.save();
	open = false;
}

let mcpInput = $state<MCP>({
	type: "http",
	name: "",
	url: "",
	command: "",
	args: "",
	enabled: true,
});

function resetMCPInput() {
	mcpInput.name = "";
	mcpInput.url = "";
	mcpInput.command = "";
	mcpInput.args = "";
}

function addMCP() {
	config.settings.mcps.push({ ...mcpInput });
	resetMCPInput();
	isMCPInputOpen = false;
}

function deleteMCP(name: string) {
	config.settings.mcps = config.settings.mcps.filter((mcp) => mcp.name !== name);
}

function editMCP(mcp: MCP) {
	mcpInput = { ...mcp };
	isMCPInputOpen = true;
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

				<Field.Separator />

				<Field.Group>
					<Field.Field>
						<Field.Label>Labs</Field.Label>
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

				<Field.Group>
					<Field.Field>
						<Field.Label>Default Model</Field.Label>
						<Popover.Root bind:open={isDefaultModelPopoverOpen}>
							<Popover.Trigger
								class={cn(
									buttonVariants({
										variant: "outline",
									}),
									"justify-between",
								)}
							>
								{#if config.settings.defaultModel}
									<span class="truncate"
										>{config.settings.defaultModel.split("/")[1]}</span
									>
								{:else}
									<span>Select model</span>
								{/if}
								<ChevronDownIcon class="opacity-50 size-4" />
							</Popover.Trigger>
							<Popover.Content class="p-0 w-full" side="bottom">
								<Command.Root>
									<Command.Input placeholder="Search models..." />
									<Command.List>
										<Command.Empty>No results found.</Command.Empty>
										<Command.Group>
											{#each await getModels(config.settings.labs) as model (model.id)}
												<Command.Item
													value={model.id}
													onSelect={() => {
														config.settings.defaultModel = model.id;
														isDefaultModelPopoverOpen = false;
													}}
												>
													<span class="truncate">
														{model.id.split("/")[1]}
													</span>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					</Field.Field>
				</Field.Group>

				<Field.Separator />

				<Field.Group>
					<Field.Field>
						<Field.Label>MCP Servers</Field.Label>
						{#each config.settings.mcps as mcp (mcp.name)}
							<Field.Field orientation="horizontal">
								<Field.Label>{mcp.name}</Field.Label>
								<Switch id={mcp.name} bind:checked={mcp.enabled} />
								<Button
									size="icon-sm"
									variant="outline"
									onclick={() => editMCP(mcp)}
								>
									<Pencil />
								</Button>
								<Button
									variant="destructive"
									size="icon-sm"
									onclick={() => deleteMCP(mcp.name)}
								>
									<Trash2 />
								</Button>
							</Field.Field>
						{/each}

						{#if isMCPInputOpen}
							<Field.Separator />

							<Field.Field>
								<Field.Label>New MCP Server</Field.Label>
								<Tabs.Root
									bind:value={mcpInput.type}
									onValueChange={resetMCPInput}
								>
									<Tabs.List>
										<Tabs.Trigger value="http">http</Tabs.Trigger>
										<Tabs.Trigger value="stdio">stdio</Tabs.Trigger>
									</Tabs.List>
									<Tabs.Content value="http">
										<div class="flex flex-col gap-2">
											<Input
												placeholder="name"
												required
												bind:value={mcpInput.name}
											/>
											<Input
												placeholder="http://localhost:3000/mcp"
												bind:value={mcpInput.url}
												required
											/>
										</div>
									</Tabs.Content>
									<Tabs.Content value="stdio">
										<div class="flex flex-col gap-2">
											<Input
												placeholder="name"
												required
												bind:value={mcpInput.name}
											/>

											<div class="flex gap-2">
												<Input
													placeholder="bunx"
													required
													bind:value={mcpInput.command}
												/>
												<Input
													placeholder="arg1 arg2"
													required
													bind:value={mcpInput.args}
												/>
											</div>
										</div>
									</Tabs.Content>
								</Tabs.Root>
								<div class="flex gap-2 justify-end">
									<Button
										variant="outline"
										onclick={() => {
											isMCPInputOpen = false;
										}}
									>
										Cancel
									</Button>
									<Button onclick={addMCP}>Save</Button>
								</div>
							</Field.Field>
						{:else}
							<Field.Field>
								<Button
									class="w-full"
									variant="outline"
									onclick={() => {
										isMCPInputOpen = true;
									}}
								>
									Add MCP Server
									<PlusIcon />
								</Button>
							</Field.Field>
						{/if}
					</Field.Field>
				</Field.Group>

				<Field.Separator />
			</Field.Set>

			<div class="flex gap-2 mt-6 sm:justify-end">
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
