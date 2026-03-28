<script lang="ts">
import ArrowDown from "@lucide/svelte/icons/arrow-down";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Pencil from "@lucide/svelte/icons/pencil";
import PlusIcon from "@lucide/svelte/icons/plus";
import Settings from "@lucide/svelte/icons/settings";
import Trash2 from "@lucide/svelte/icons/trash-2";
import X from "@lucide/svelte/icons/x";
import * as Kbd from "$lib/components/ui/kbd";
import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
import { Button, buttonVariants } from "$lib/components/ui/button";
import * as Dialog from "$lib/components/ui/dialog";
import * as Field from "$lib/components/ui/field";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select";
import { Switch } from "$lib/components/ui/switch";
import * as Tabs from "$lib/components/ui/tabs/index.js";
import { config, type MCP, type ToolName } from "$lib/config.svelte";
import { getLabs, getProviders } from "$lib/openrouter";
import { isMac, isMobile } from "$lib/utils";

let open = $state(!config.settings.apiKey);
let isMCPInputOpen = $state(false);
let mcpToDelete = $state<string | null>(null);
let isDeleteMCPAlertOpen = $state(false);
let isResetAlertOpen = $state(false);
let activeSection = $state<"provider" | "ui" | "tools" | "mcps">("provider");

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
	deleteMCP(mcp.name);
	mcpInput = { ...mcp };
	isMCPInputOpen = true;
}

function handleKeydown(e: KeyboardEvent) {
	if (e.code === "Comma" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		open = !open;
	}
}

let preferredProviderToAdd = $state<string>("");

function moveProvider(index: number, direction: "up" | "down") {
	const providers = config.settings.preferredProviders;
	const newIndex = direction === "up" ? index - 1 : index + 1;
	if (newIndex < 0 || newIndex >= providers.length) return;
	const newProviders = [...providers];
	[newProviders[index], newProviders[newIndex]] = [
		newProviders[newIndex],
		newProviders[index],
	];
	config.settings.preferredProviders = newProviders;
}

function removeProvider(index: number) {
	config.settings.preferredProviders = config.settings.preferredProviders.filter(
		(_, i) => i !== index,
	);
}

function addPreferredProvider() {
	if (config.settings.preferredProviders.includes(preferredProviderToAdd)) return;
	config.settings.preferredProviders.push(preferredProviderToAdd);
	preferredProviderToAdd = "";
}

const toolDefinitions: { name: ToolName; label: string; description: string }[] = [
	{ name: "fetch", label: "Fetch", description: "Fetch and read content from URLs" },
	{ name: "search", label: "Search", description: "Brave web search" },
	{ name: "shell", label: "Shell", description: "Execute bash commands" },
	{ name: "skill", label: "Skill Reader", description: "Read skill files" },
];

function isToolEnabled(name: ToolName): boolean {
	return config.settings.enabledTools.includes(name);
}

function toggleTool(name: ToolName, enabled: boolean) {
	if (enabled) {
		if (!config.settings.enabledTools.includes(name)) {
			config.settings.enabledTools.push(name);
		}
	} else {
		config.settings.enabledTools = config.settings.enabledTools.filter((t) => t !== name);
	}
}

const menuItems: { id: typeof activeSection; label: string }[] = [
	{ id: "provider", label: "Provider" },
	{ id: "tools", label: "Tools" },
	{ id: "ui", label: "UI" },
	{ id: "mcps", label: "MCP Servers" },
];
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={buttonVariants({
			variant: isMobile.current ? "secondary" : "ghost",
			size: "icon",
		})}
		aria-label="Settings"
	>
		<Settings aria-hidden="true" />
	</Dialog.Trigger>

	<Dialog.Content class="overflow-hidden p-0 sm:max-w-2xl">
		<form onsubmit={handleSubmit} class="flex h-[65vh] flex-col">
			<div class="flex flex-1 overflow-hidden">
				<!-- Sidebar -->
				<div class="flex w-40 flex-col gap-1 border-r bg-muted/50 p-4">
					{#each menuItems as item}
						<button
							type="button"
							class="w-full rounded-md px-3 py-2 text-left text-sm transition-colors {activeSection ===
							item.id
								? 'bg-accent font-medium text-accent-foreground'
								: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}"
							onclick={() => (activeSection = item.id)}
						>
							{item.label}
						</button>
					{/each}
				</div>

				<!-- Content -->
				<div class="flex-1 overflow-y-auto p-6">
					<!-- Provider Section -->
					{#if activeSection === "provider"}
						<Field.Set>
							<Field.Legend>Provider Settings</Field.Legend>
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
										<a
											href="https://openrouter.ai/settings/keys"
											target="_blank"
											rel="noopener noreferrer">here ↗</a
										>.
									</Field.Description>
								</Field.Field>

								<Field.Field>
									<Field.Label>Proxy URL</Field.Label>
									<Input
										type="url"
										bind:value={config.settings.proxyUrl}
										name="proxyUrl"
										placeholder="http://localhost:8080"
									/>
									<Field.Description>
										Optional proxy for web scraping requests.
									</Field.Description>
								</Field.Field>

								<Field.Field>
									<Field.Label>Labs</Field.Label>
									<Select.Root bind:value={config.settings.labs} type="multiple">
										<Select.Trigger class="w-full">
											<Label class="truncate">
												{config.settings.labs.join(", ")}
											</Label>
										</Select.Trigger>
										<Select.Content class="max-h-64 overflow-y-scroll">
											{#each await getLabs() as lab}
												<Select.Item value={lab}>{lab}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</Field.Field>

								<Field.Field>
									<Field.Label>Preferred Providers</Field.Label>
									<Field.Description>
										Providers to prioritize when routing requests.
									</Field.Description>
									<div class="mt-2 flex flex-col gap-2">
										{#if config.settings.preferredProviders.length === 0}
											<p class="text-sm text-muted-foreground">No preferred providers</p>
										{:else}
											<ol class="flex flex-col gap-1">
												{#each config.settings.preferredProviders as provider, index (provider)}
													<li class="flex items-center gap-2 rounded-md border px-3 py-2">
														<span class="w-6 text-sm text-muted-foreground"
															>{index + 1}.</span
														>
														<span class="flex-1 text-sm">{provider}</span>
														<div class="flex items-center gap-1">
															<Button
																size="icon-sm"
																variant="ghost"
																disabled={index === 0}
																onclick={() => moveProvider(index, "up")}
																aria-label="Move up"
															>
																<ArrowUp class="size-4" />
															</Button>
															<Button
																size="icon-sm"
																variant="ghost"
																disabled={index ===
																	config.settings.preferredProviders.length - 1}
																onclick={() => moveProvider(index, "down")}
																aria-label="Move down"
															>
																<ArrowDown class="size-4" />
															</Button>
															<Button
																size="icon-sm"
																variant="ghost"
																onclick={() => removeProvider(index)}
																aria-label="Remove"
															>
																<X class="size-4" />
															</Button>
														</div>
													</li>
												{/each}
											</ol>
										{/if}
										<div class="flex gap-2">
											<Select.Root type="single" bind:value={preferredProviderToAdd}>
												<Select.Trigger class="flex-1">
													<span class="truncate">
														{preferredProviderToAdd || "Add provider..."}
													</span>
												</Select.Trigger>
												<Select.Content class="max-h-64 overflow-y-scroll">
													{#each await getProviders() as provider}
														<Select.Item value={provider.slug}
															>{provider.name}</Select.Item
														>
													{/each}
												</Select.Content>
											</Select.Root>
											<Button
												size="icon"
												variant="outline"
												disabled={!preferredProviderToAdd}
												onclick={addPreferredProvider}
												aria-label="Add"
											>
												<PlusIcon class="size-4" />
											</Button>
										</div>
									</div>
								</Field.Field>

								<Field.Field>
									<Field.Label>Ignored Providers</Field.Label>
									<Select.Root
										bind:value={config.settings.ignoredProviders}
										type="multiple"
									>
										<Select.Trigger class="w-full">
											<Label class="truncate">
												{config.settings.ignoredProviders.length > 0
													? `${config.settings.ignoredProviders.length} providers ignored`
													: "No providers ignored"}
											</Label>
										</Select.Trigger>
										<Select.Content class="max-h-64 overflow-y-scroll">
											{#each await getProviders() as provider}
												<Select.Item value={provider.slug}>{provider.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
									<Field.Description>
										Providers to skip when routing requests.
									</Field.Description>
								</Field.Field>
							</Field.Group>
						</Field.Set>
					{/if}

					<!-- Tools Section -->
					{#if activeSection === "tools"}
						<Field.Set>
							<Field.Legend>Enabled Tools</Field.Legend>
							<Field.Description class="mb-4">
								Select which tools the AI can use during conversations.
							</Field.Description>
							<Field.Group>
								{#each toolDefinitions as tool}
									<Field.Field orientation="horizontal">
										<Field.Content>
											<Field.Label>{tool.label}</Field.Label>
											<Field.Description>{tool.description}</Field.Description>
										</Field.Content>
										<Switch
											id={`tool-${tool.name}`}
											checked={isToolEnabled(tool.name)}
											onCheckedChange={(checked) => toggleTool(tool.name, checked)}
										/>
									</Field.Field>
								{/each}
							</Field.Group>
						</Field.Set>
					{/if}

					<!-- UI Section -->
					{#if activeSection === "ui"}
						<Field.Set>
							<Field.Legend>UI Settings</Field.Legend>
							<Field.Group>
								<Field.Field orientation="horizontal">
									<Field.Content>
										<Field.Label>Message Stats</Field.Label>
										<Field.Description>
											Show token usage and cost for each message.
										</Field.Description>
									</Field.Content>
									<Switch id="stats" bind:checked={config.settings.stats} />
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Field.Content>
										<Field.Label
											>Show Tool Output <Kbd.Root class="hidden sm:inline-flex">
												{isMac ? "⌘" : "Ctrl"} + T
											</Kbd.Root>
										</Field.Label>
										<Field.Description
											>Show tool call details in messages.</Field.Description
										>
									</Field.Content>
									<Switch
										id="showToolOutput"
										bind:checked={config.settings.showToolOutput}
									/>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Field.Content>
										<Field.Label
											>Show Reasoning <Kbd.Root class="hidden sm:inline-flex">
												{isMac ? "⌘" : "Ctrl"} + R
											</Kbd.Root>
										</Field.Label>
										<Field.Description
											>Show reasoning parts in messages.</Field.Description
										>
									</Field.Content>
									<Switch
										id="showReasoning"
										bind:checked={config.settings.showReasoning}
									/>
								</Field.Field>
							</Field.Group>
						</Field.Set>
					{/if}

					<!-- MCP Servers Section -->
					{#if activeSection === "mcps"}
						<Field.Set>
							<Field.Legend>MCP Servers</Field.Legend>
							<Field.Group class="gap-3">
								{#each config.settings.mcps as mcp (mcp.name)}
									<Field.Field orientation="horizontal">
										<Field.Label>{mcp.name}</Field.Label>
										<Switch id={mcp.name} bind:checked={mcp.enabled} />
										<Button
											size="icon-sm"
											variant="outline"
											aria-label="Edit {mcp.name}"
											onclick={() => editMCP(mcp)}
										>
											<Pencil aria-hidden="true" />
										</Button>
										<Button
											variant="destructive"
											size="icon-sm"
											aria-label="Delete {mcp.name}"
											onclick={() => {
												mcpToDelete = mcp.name;
												isDeleteMCPAlertOpen = true;
											}}
										>
											<Trash2 aria-hidden="true" />
										</Button>
									</Field.Field>
								{/each}

								{#if isMCPInputOpen}
									<Field.Separator />
									<Field.Field>
										<Field.Label>New MCP Server</Field.Label>
										<Tabs.Root bind:value={mcpInput.type} onValueChange={resetMCPInput}>
											<Tabs.List>
												<Tabs.Trigger value="http">http</Tabs.Trigger>
												<Tabs.Trigger value="stdio">stdio</Tabs.Trigger>
											</Tabs.List>
											<Tabs.Content value="http">
												<div class="flex flex-col gap-2">
													<Input placeholder="name" required bind:value={mcpInput.name} />
													<Input
														placeholder="http://localhost:3000/mcp"
														bind:value={mcpInput.url}
														required
													/>
												</div>
											</Tabs.Content>
											<Tabs.Content value="stdio">
												<div class="flex flex-col gap-2">
													<Input placeholder="name" required bind:value={mcpInput.name} />
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
										<div class="flex justify-end gap-2">
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
							</Field.Group>
						</Field.Set>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<Dialog.Footer class="border-t p-4">
				<Button variant="destructive" onclick={() => (isResetAlertOpen = true)}>
					Reset
				</Button>

				<AlertDialog.Root bind:open={isResetAlertOpen}>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Reset All Settings?</AlertDialog.Title>
							<AlertDialog.Description>
								This will reset all settings to default. This action cannot be undone.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action
								class={buttonVariants({ variant: "destructive" })}
								onclick={() => {
									config.clear();
									isResetAlertOpen = false;
								}}
							>
								Reset
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>

				<div class="flex-1"></div>

				<Dialog.Close class={buttonVariants({ variant: "outline" })}>Cancel</Dialog.Close>
				<Button type="submit">Save settings</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={isDeleteMCPAlertOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete MCP Server?</AlertDialog.Title>
			<AlertDialog.Description>
				This will permanently delete "{mcpToDelete}".
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (isDeleteMCPAlertOpen = false)}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action
				class={buttonVariants({ variant: "destructive" })}
				onclick={() => {
					if (mcpToDelete) deleteMCP(mcpToDelete);
					isDeleteMCPAlertOpen = false;
					mcpToDelete = null;
				}}
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
