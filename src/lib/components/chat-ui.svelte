<script lang="ts">
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import Trash2 from "@lucide/svelte/icons/trash-2";
import ChevronDown from "@lucide/svelte/icons/chevron-down";
import * as Collapsible from "$lib/components/ui/collapsible/index.js";
import Bot from "@lucide/svelte/icons/bot";
import Brain from "@lucide/svelte/icons/brain";
import CircleX from "@lucide/svelte/icons/circle-x";
import Clock from "@lucide/svelte/icons/clock";
import Copy from "@lucide/svelte/icons/copy";
import DollarSign from "@lucide/svelte/icons/dollar-sign";
import FileText from "@lucide/svelte/icons/file-text";
import FileUp from "@lucide/svelte/icons/file-up";
import FileX from "@lucide/svelte/icons/file-x";
import Gauge from "@lucide/svelte/icons/gauge";
import Image from "@lucide/svelte/icons/image";
import Music from "@lucide/svelte/icons/music";
import Paperclip from "@lucide/svelte/icons/paperclip";
import RefreshCcw from "@lucide/svelte/icons/refresh-ccw";
import Server from "@lucide/svelte/icons/server";
import Square from "@lucide/svelte/icons/square";
import SquarePen from "@lucide/svelte/icons/square-pen";
import Star from "@lucide/svelte/icons/star";
import Video from "@lucide/svelte/icons/video";
import WholeWord from "@lucide/svelte/icons/whole-word";
import { tick } from "svelte";
import { slide } from "svelte/transition";
import { toast } from "svelte-sonner";
import AiMessage from "$lib/components/ai-message.svelte";
import FileIcon from "$lib/components/file-icon.svelte";
import Loader from "$lib/components/loader.svelte";
import { Button } from "$lib/components/ui/button";
import { buttonVariants } from "$lib/components/ui/button/index.js";
import * as Command from "$lib/components/ui/command/index.js";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import * as InputGroup from "$lib/components/ui/input-group";
import * as Kbd from "$lib/components/ui/kbd";
import * as Popover from "$lib/components/ui/popover/index.js";
import * as Tooltip from "$lib/components/ui/tooltip/index.js";
import { config } from "$lib/config.svelte";
import { getModels } from "$lib/openrouter";
import {
	cn,
	collapseFilename,
	fmtContext,
	isMac,
	isMobile,
	roundToSignificant,
} from "$lib/utils";
import {
	isToolUIPart,
	getToolName,
	isTextUIPart,
	isFileUIPart,
	isReasoningUIPart,
} from "ai";
import { Spinner } from "$lib/components/ui/spinner/index.js";
import { chat } from "$lib/chat.svelte";

import { ScrollState } from "runed";
import ToolIcon from "./tool-icon.svelte";

const scroll = new ScrollState({
	element: () => document.documentElement,
	behavior: "smooth",
});

let input = $state("");
let inputElement = $state<HTMLTextAreaElement | null>(null);
let fileList = $state<FileList>();
let hoveredModel = $state("");
let isModelsPopoverOpen = $state(false);
let isResponding = $derived(
	chat.current.status !== "error" &&
		chat.current.status !== "ready" &&
		chat.current.lastMessage?.role !== "assistant",
);
let isStreaming = $derived(chat.current.status === "streaming");
let isThinking = $derived(
	chat.current.status === "streaming" &&
		chat.current.lastMessage?.parts.at(-1)?.type === "reasoning",
);

let dragCounter = $state(0);
let isDragging = $derived(dragCounter > 0);

const favorites = $derived(new Set(config.settings.favorites));
const models = $derived(await getModels(config.settings.labs));
const modelsList = $derived([
	...favorites,
	...models.filter((m) => !favorites.has(m.id)).map((m) => m.id),
]);
const currentModel = $derived(models.find((m) => m.id === config.settings.model));

const totalStats = $derived.by(() => {
	const assistantMessages = chat.current.messages.filter((m) => m.role === "assistant");
	let cost = 0;

	for (const msg of assistantMessages) {
		if (msg.metadata) cost += msg.metadata.cost;
	}

	const lastMessageWithMetadata = assistantMessages.findLast((m) => m.metadata);
	const tokens = lastMessageWithMetadata?.metadata?.totalTokens ?? 0;

	const contextLength = currentModel?.contextLength ?? 0;
	const contextPercent =
		contextLength > 0 ? Math.round((tokens / contextLength) * 100) : 0;

	return {
		cost,
		tokens,
		contextPercent,
		contextLength,
	};
});

const modalities = $derived(
	models.filter((m) => m.id === config.settings.model)[0]?.modalities,
);
const inputModalities = $derived.by(() => {
	let types = [];
	if (modalities.input.includes("image")) {
		types.push("image/png,image/jpeg,image/webp,image/heic,image/heif");
	}
	if (modalities.input.includes("audio")) {
		types.push(
			"audio/x-aac,audio/flac,audio/mp3,audio/m4a,audio/mpeg,audio/mpga,audio/mp4,audio/ogg,audio/pcm,audio/wav,audio/webm,audio/vnd.wave,application/ogg",
		);
	}
	if (modalities.input.includes("video")) {
		types.push(
			"video/x-flv,video/quicktime,video/mpeg,video/mpegs,video/mpg,video/mp4,video/webm,video/wmv,video/3gpp",
		);
	}
	if (modalities.input.includes("file")) {
		types.push("application/pdf,text/plain");
	}
	return types.join(",");
});
const modalityIcons = [
	{ icon: FileText, key: "file" },
	{ icon: Image, key: "image" },
	{ icon: Music, key: "audio" },
	{ icon: Video, key: "video" },
] as const;

const supportedParameters = $derived(
	config.settings.model &&
		models.find((m) => m.id === config.settings.model)?.supportedParameters,
);

const reasoningOptions = ["none", "minimal", "low", "medium", "high", "xhigh"];

let userHasScrolled = $state(false);
let messageRefs = $state<Record<number, HTMLElement>>({});
const lastMessageIndex = $derived(chat.current.messages.length - 1);

// Message queue for pending messages while streaming
type QueuedMessage = { text?: string; files?: FileList };
let messageQueue = $state<QueuedMessage[]>([]);

// Process queue when ready
$effect(() => {
	if (chat.current.status === "ready" && messageQueue.length > 0) {
		// Merge all queued messages into one
		const texts = messageQueue.map((m) => m.text).filter(Boolean);
		const allFiles = messageQueue.flatMap((m) => (m.files ? [...m.files] : []));
		messageQueue = []; // Clear queue

		if (texts.length > 0 || allFiles.length > 0) {
			const dataTransfer = new DataTransfer();
			allFiles.forEach((f) => dataTransfer.items.add(f));

			if (texts.length > 0 && allFiles.length > 0) {
				chat.current.sendMessage({
					text: texts.join("\n\n"),
					files: dataTransfer.files,
				});
			} else if (texts.length > 0) {
				chat.current.sendMessage({ text: texts.join("\n\n") });
			} else {
				chat.current.sendMessage({ files: dataTransfer.files });
			}
		}
	}
});
const lastMessageElement = $derived(messageRefs[lastMessageIndex]);

async function handleSubmit() {
	const text = input.trim();
	const files = fileList;
	input = "";
	fileList = undefined;

	if (!text && !files) return;

	// Check if a response is in progress (submitted or streaming)
	if (chat.current.status === "submitted" || chat.current.status === "streaming") {
		// Queue message to be sent after current response finishes
		messageQueue.push({ text, files });
	} else {
		if (text) {
			chat.current.sendMessage({ text, files });
		} else if (files) {
			chat.current.sendMessage({ files });
		}
		await tick();
		scroll.scrollToBottom();
		userHasScrolled = false;
	}
}

function handleStop() {
	chat.current.stop();
}

function handleKeydown(e: KeyboardEvent) {
	if (e.code === "KeyM" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		isModelsPopoverOpen = !isModelsPopoverOpen;
	} else if (e.code === "KeyO" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		chat.newChat();
	} else if (e.code === "KeyT" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		config.settings.showToolOutput = !config.settings.showToolOutput;
		config.save();
	} else if (e.code === "KeyR" && (isMac ? e.metaKey : e.ctrlKey)) {
		e.preventDefault();
		config.settings.showReasoning = !config.settings.showReasoning;
		config.save();
	}
}

function handleCopy(data: string | number) {
	navigator.clipboard.writeText(String(data));
	toast.success("Copied to clipboard");
}

function handlePaste(e: ClipboardEvent) {
	const files = e.clipboardData?.files;
	if (!files?.length) return;

	e.preventDefault();
	const dataTransfer = new DataTransfer();

	for (const file of [...(fileList || []), ...files]) {
		if (!file.type || !inputModalities.includes(file.type)) {
			toast.error("Unsupported file type");
			continue;
		}
		dataTransfer.items.add(file);
	}

	fileList = dataTransfer.files;
}

function handleFavorite(model: string) {
	if (favorites.has(model)) {
		favorites.delete(model);
	} else {
		favorites.add(model);
	}
	config.settings.favorites = [...favorites].sort();
	config.save();
}

function handleDrop(e: DragEvent) {
	e.preventDefault();
	e.stopPropagation();
	dragCounter = 0;

	const dataTransfer = new DataTransfer();

	const files = [...(fileList || []), ...(e.dataTransfer?.files || [])];

	for (const file of files) {
		if (!file.type || !inputModalities.includes(file.type)) {
			toast.error("Unsupported file type");
			continue;
		}
		dataTransfer.items.add(file);
	}

	fileList = dataTransfer.files;
}

function handleRemoveFile(file: File) {
	const dataTransfer = new DataTransfer();
	for (const f of fileList!) {
		if (f !== file) {
			dataTransfer.items.add(f);
		}
	}
	fileList = dataTransfer.files;
}

function handleEdit(messageIndex: number) {
	const message = chat.current.messages[messageIndex];
	input = message.parts.find((p) => p.type === "text")?.text ?? "";
	chat.current.messages = chat.current.messages.slice(0, messageIndex);
	inputElement?.focus();
}

$effect(() => {
	if (!chat.isLoading) {
		inputElement?.focus();
		scroll.scrollToBottom();
	}
});

$effect(() => {
	if (chat.current.error) {
		toast.error(chat.current.error.message || "Something went wrong");
	}
});

$effect(() => {
	if (
		(isStreaming || isThinking) &&
		!userHasScrolled &&
		chat.current.lastMessage?.parts &&
		lastMessageElement
	) {
		const rect = lastMessageElement.getBoundingClientRect();
		if (rect.top > 48) {
			lastMessageElement.scrollIntoView({ block: "start", behavior: "smooth" });
		}
	}
});
</script>

<svelte:window
	onkeydown={handleKeydown}
	ondragover={(e) => e.preventDefault()}
	ondragenter={() => dragCounter++}
	ondragleave={() => dragCounter--}
	ondrop={handleDrop}
	onpaste={handlePaste}
	onwheel={() => (userHasScrolled = true)}
	ontouchmove={() => (userHasScrolled = true)}
/>

{#if isDragging}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/25 backdrop-blur-sm"
	>
		<div
			class="flex size-[80%] flex-col items-center justify-center gap-4 rounded-2xl border-3 border-dashed border-primary-foreground text-lg text-primary-foreground text-shadow-md/20 dark:border-muted-foreground dark:text-muted-foreground"
		>
			{#if inputModalities}
				<FileUp class="size-12 animate-bounce drop-shadow-md/20" />
				<span>Drop files here</span>
			{:else}
				<FileX class="size-12 drop-shadow-md/20" />
				<span>This model doesn't support file inputs</span>
			{/if}
		</div>
	</div>
{/if}

<div class="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-2">
	{#if chat.current.messages.length}
		<ul class="mt-20 mb-6 h-full w-full space-y-10 overflow-hidden px-2 sm:px-5" in:slide>
			{#each chat.current.messages as message, messageIndex (message.id)}
				{@const isLastMessage = messageIndex === chat.current.messages.length - 1}
				{@const isAssistant = message.role === "assistant"}
				{@const isUser = message.role === "user"}
				<li
					class="flex w-full scroll-mt-12 flex-col space-y-2"
					class:hidden={isLastMessage && isAssistant && isResponding}
					bind:this={messageRefs[messageIndex]}
				>
					{#each message.parts as part, partIndex (partIndex)}
						{#if isUser}
							{#if isFileUIPart(part)}
								<Button variant="outline" size="sm" class="ms-auto">
									<FileIcon type={part.type} />
									<span>{part.filename}</span>
								</Button>
							{:else if isTextUIPart(part)}
								<p
									class="ms-auto w-fit max-w-full rounded-2xl rounded-tr-[3px] bg-primary px-3.5 py-2 leading-6.5 whitespace-pre-wrap text-primary-foreground sm:max-w-5/6 sm:leading-normal"
								>
									{part.text}
								</p>
							{/if}
						{:else if isToolUIPart(part)}
							{@const toolName = getToolName(part)}
							{@const isPending = !part.state.startsWith("output")}
							{@const input = part.input ? Object.values(part.input)[0] : ""}
							{@const output =
								part.state === "output-available" ? part.output.trim() : ""}
							<Collapsible.Root
								open={config.settings.showToolOutput}
								class="animate-in rounded-lg px-2 font-mono text-sm fade-in hover:bg-muted/50"
							>
								<Collapsible.Trigger
									class="group flex w-full items-center justify-between gap-2 py-2 text-left"
								>
									{#if isPending}
										<Spinner class="size-4 shrink-0" />
									{:else if output}
										<ChevronDown
											class="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
										/>
									{:else}
										<span class="px-1">•</span>
									{/if}
									<div class="flex items-center gap-2">
										<ToolIcon {toolName} />
										{toolName}
									</div>

									{#if input}
										<span class="me-auto truncate text-muted-foreground">
											{input.split("\n")[0]}
										</span>
									{/if}
								</Collapsible.Trigger>
								<Collapsible.Content>
									{#if input && input.split("\n").length > 1}
										<pre
											class="me-auto mb-4 rounded-lg bg-muted p-2 break-all whitespace-pre-wrap">{Object.values(
												part.input,
											)}</pre>
									{/if}

									{#if output}
										<pre
											class="mb-2 rounded-lg bg-muted p-2 break-all whitespace-pre-wrap">{output}</pre>
									{/if}
								</Collapsible.Content>
							</Collapsible.Root>
						{:else if isTextUIPart(part)}
							<AiMessage content={part.text} isStreaming={isStreaming && isLastMessage} />
						{:else if isReasoningUIPart(part)}
							<Collapsible.Root
								open={config.settings.showReasoning}
								class="animate-in rounded-lg px-2 text-sm fade-in hover:bg-muted/50"
							>
								<Collapsible.Trigger
									class="group font-ligh flex w-full items-center gap-2 py-2 text-left font-mono"
								>
									{#if part.state === "streaming"}
										<Spinner class="size-4 shrink-0" />
										<Brain class="size-4" />
										<span>thinking...</span>
									{:else}
										<ChevronDown
											class="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
										/>
										<Brain class="size-4" />
										<span>reasoning</span>
									{/if}
								</Collapsible.Trigger>
								<Collapsible.Content class="mb-2 rounded-lg bg-background px-2">
									<AiMessage
										content={part.text}
										isStreaming={isStreaming && isLastMessage}
										reasoning={true}
									/>
								</Collapsible.Content>
							</Collapsible.Root>
						{:else if isFileUIPart(part)}
							{#if part.mediaType.startsWith("image/")}
								<a href={part.url} download aria-label="Download image">
									<img class="rounded-2xl" src={part.url} alt={part.filename} />
								</a>
							{/if}
						{/if}
					{/each}

					<div
						class:ms-auto={isUser}
						class:hidden={isLastMessage && isStreaming}
						class="flex items-center gap-1"
					>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Copy message"
							onclick={() => {
								const text = message.parts
									.filter(isTextUIPart)
									.map((p) => p.text)
									.join("\n");
								if (text) handleCopy(text);
							}}
						>
							<Copy />
						</Button>

						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Regenerate response"
							onclick={() => chat.current.regenerate({ messageId: message.id })}
						>
							<RefreshCcw />
						</Button>

						{#if !isAssistant}
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Edit message"
								onclick={() => handleEdit(messageIndex)}
							>
								<SquarePen />
							</Button>
						{/if}

						{#if config.settings.stats && isAssistant && message.metadata}
							{@const { completionTokens, cost, tps, time, provider } = message.metadata}
							<div
								class="grid grid-cols-2 justify-items-start gap-1 font-mono text-neutral-400 sm:flex dark:text-neutral-500"
							>
								<Button
									variant="ghost"
									size="xs"
									aria-label="Copy token count"
									onclick={() => handleCopy(completionTokens)}
								>
									<WholeWord />
									{completionTokens} tokens
								</Button>
								<Button
									variant="ghost"
									size="xs"
									aria-label="Copy cost"
									onclick={() => handleCopy(cost)}
								>
									<DollarSign />
									{cost}
								</Button>
								<Button
									variant="ghost"
									size="xs"
									aria-label="Copy response time"
									onclick={() => handleCopy(time)}
								>
									<Clock />
									{time}s
								</Button>
								<Button
									variant="ghost"
									size="xs"
									aria-label="Copy tokens per second"
									onclick={() => handleCopy(tps)}
								>
									<Gauge />
									{tps} tokens/s
								</Button>
								<Button
									variant="ghost"
									size="xs"
									aria-label="Copy provider"
									onclick={() => handleCopy(provider)}
								>
									<Server />
									{provider}
								</Button>
							</div>
						{/if}
					</div>
				</li>
			{/each}

			<div class="mb-10">
				{#if isResponding}
					<Loader />
				{/if}
			</div>
		</ul>
	{/if}

	<form
		class="sticky bottom-2 w-full sm:bottom-4"
		onsubmit={async (e) => {
			e.preventDefault();
			if (chat.current.status === "streaming") {
				handleStop();
			} else {
				await handleSubmit();
			}
		}}
	>
		{#if messageQueue.length > 0}
			<div
				class="mx-5 flex flex-col gap-2 rounded-t-xl border border-b-0 bg-muted/85 px-3 py-2 backdrop-blur-md"
			>
				{#each messageQueue as msg, i}
					<div class="group flex items-center gap-3 text-sm text-muted-foreground">
						<span class="text-xs font-medium tabular-nums">
							{i + 1}
						</span>
						<span class="truncate">
							{msg.text || "📎 file"}
						</span>
						<Button
							class="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
							variant="ghost"
							size="icon-xs"
							aria-label="Remove message"
							onclick={() => {
								messageQueue = messageQueue.filter((_, j) => i !== j);
							}}
						>
							<Trash2 />
						</Button>
					</div>
				{/each}
			</div>
		{/if}

		<InputGroup.Root
			class="rounded-3xl bg-muted/85 px-2 py-1 backdrop-blur-md dark:bg-muted/85"
		>
			{#if fileList?.length}
				{#snippet fileItem(file: File, preview: boolean)}
					<li>
						<Button
							variant="outline"
							size={preview ? "icon" : "sm"}
							class="group/file relative cursor-pointer {preview ? 'size-auto p-0' : ''}"
							onclick={() => handleRemoveFile(file)}
						>
							{#if preview}
								<div class="size-16 overflow-clip rounded-md">
									{#if file.type.startsWith("image/")}
										<img
											class="size-full object-cover"
											src={URL.createObjectURL(file)}
											alt={file.name}
											style="overflow-clip-margin: unset;"
										/>
									{:else}
										<!-- svelte-ignore a11y_media_has_caption -->
										<video class="size-full object-cover" src={URL.createObjectURL(file)}
										></video>
									{/if}
								</div>
							{:else}
								<FileIcon type={file.type} />
								<span>{collapseFilename(file.name)}</span>
							{/if}

							<div
								class="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full border bg-background text-foreground opacity-0 transition-opacity group-hover/file:opacity-100"
							>
								<CircleX class="size-3" />
							</div>
						</Button>
					</li>
				{/snippet}

				{@const mediaFiles = [...fileList].filter(
					(f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
				)}
				{@const otherFiles = [...fileList].filter(
					(f) => !f.type.startsWith("image/") && !f.type.startsWith("video/"),
				)}

				<InputGroup.Addon align="block-start" class="flex-col items-start">
					{#if mediaFiles.length}
						<ul class="flex flex-wrap gap-2">
							{#each mediaFiles as file}
								{@render fileItem(file, true)}
							{/each}
						</ul>
					{/if}

					{#if otherFiles.length}
						<ul class="flex flex-wrap gap-2">
							{#each otherFiles as file}
								{@render fileItem(file, false)}
							{/each}
						</ul>
					{/if}
				</InputGroup.Addon>
			{/if}

			<InputGroup.Textarea
				bind:ref={inputElement}
				bind:value={input}
				class="max-h-36 md:text-base"
				autofocus={!isMobile.current}
				placeholder="Generate slop…"
				rows={1}
				onkeydown={async (e) => {
					if (e.key === "Enter" && !e.shiftKey && (input.trim() || fileList?.length)) {
						e.preventDefault();
						await handleSubmit();
					}
				}}
			/>

			<InputGroup.Addon align="block-end">
				{#if config.settings.model}
					<InputGroup.Button
						variant="outline"
						class="relative rounded-full"
						size="icon-sm"
						disabled={!inputModalities}
						aria-label="Attach files"
					>
						<label class="absolute inset-0 flex items-center justify-center">
							<Paperclip />
							<input
								type="file"
								multiple
								class="hidden"
								accept={inputModalities}
								bind:files={fileList}
							/>
						</label>
					</InputGroup.Button>

					<div class="hidden gap-2 sm:flex">
						{#each modalityIcons as { icon: Icon, key }}
							<Icon
								class="size-4 {modalities.input.includes(key) ? 'text-violet-400' : ''}"
							/>
						{/each}
					</div>
				{/if}

				<div class="ms-auto flex items-center gap-2">
					<div>
						{#if config.settings.stats}
							{@const circumference = 2 * Math.PI * 10}
							{@const strokeDashoffset =
								circumference - (totalStats.contextPercent / 100) * circumference}
							{@const colorClass =
								totalStats.contextPercent > 90
									? "text-red-500"
									: totalStats.contextPercent > 70
										? "text-yellow-500"
										: "text-violet-400"}
							<Tooltip.Root>
								<Tooltip.Trigger
									class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
								>
									<svg class="size-4 -rotate-90" viewBox="0 0 24 24">
										<circle
											cx="12"
											cy="12"
											r="10"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											class="text-muted-foreground/30"
										/>
										<circle
											cx="12"
											cy="12"
											r="10"
											fill="none"
											stroke="currentColor"
											stroke-width="3"
											stroke-linecap="round"
											class={colorClass}
											stroke-dasharray={circumference}
											stroke-dashoffset={strokeDashoffset}
											style="transition: stroke-dashoffset 0.3s ease"
										/>
									</svg>
								</Tooltip.Trigger>
								<Tooltip.Content side="top">
									<div class="flex flex-col items-end gap-1 font-mono">
										<span class="text-xs font-medium tabular-nums">
											${roundToSignificant(totalStats.cost)}
										</span>
										<span class="text-xs font-medium tabular-nums">
											{`${totalStats.contextPercent}%/${fmtContext.format(totalStats.contextLength)}`}
										</span>
									</div>
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}

						{#if supportedParameters?.includes("reasoning")}
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Button
											{...props}
											variant="ghost"
											size="icon-sm"
											aria-label="Reasoning level"
										>
											<Brain
												class={config.settings.reasoning === "none"
													? ""
													: "text-violet-400"}
											/>
										</Button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Group>
										<DropdownMenu.RadioGroup
											bind:value={config.settings.reasoning}
											onValueChange={() => config.save()}
										>
											{#each reasoningOptions as option}
												<DropdownMenu.RadioItem class="list-none" value={option}>
													{option}
												</DropdownMenu.RadioItem>
											{/each}
										</DropdownMenu.RadioGroup>
									</DropdownMenu.Group>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						{/if}
					</div>

					<Popover.Root
						bind:open={isModelsPopoverOpen}
						onOpenChangeComplete={(open) => !open && inputElement?.focus()}
					>
						<Popover.Trigger
							class={cn(
								buttonVariants({
									variant: "secondary",
									size: "sm",
								}),
								"max-w-48 bg-primary/10 text-xs text-foreground hover:bg-primary/15 sm:max-w-full",
							)}
						>
							<Bot />

							{#if config.settings.model}
								<span class="truncate">{config.settings.model.split("/")[1]}</span>
							{:else}
								<span class="truncate">Select model</span>
							{/if}

							<Kbd.Root class="hidden sm:inline-flex">
								{isMac ? "⌘" : "Ctrl"} + M
							</Kbd.Root>
						</Popover.Trigger>
						<Popover.Content class="w-66 p-0" side="top" align="end">
							<Command.Root>
								<Command.Input placeholder="Search models..." />
								<Command.List>
									<Command.Empty>No results found.</Command.Empty>
									<Command.Group>
										{#each modelsList as model (model)}
											{@const isFavorite = favorites.has(model)}

											{@const isHovered = hoveredModel === model}
											<Command.Item
												class="group flex justify-between gap-2"
												value={model}
												onSelect={() => {
													config.settings.model = model;
													isModelsPopoverOpen = false;
													config.save();
												}}
												onmouseenter={() => (hoveredModel = model)}
												onmouseleave={() => (hoveredModel = "")}
											>
												<span class="truncate">
													{model.split("/")[1]}
												</span>

												{#if isHovered || isFavorite}
													<div class="flex gap-2">
														<Button
															class="invisible transition-none group-hover:visible
																{isFavorite ? 'visible' : ''}"
															variant="ghost"
															size="icon-xs"
															aria-label={isFavorite
																? "Remove from favorites"
																: "Add to favorites"}
															onclick={(e) => {
																e.stopPropagation();
																handleFavorite(model);
															}}
														>
															<Star
																class={isFavorite
																	? "fill-yellow-400 text-yellow-400"
																	: ""}
															/>
														</Button>
													</div>
												{/if}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>

					<InputGroup.Button
						variant={chat.current.status === "streaming" ? "destructive" : "default"}
						class="ml-1 rounded-full"
						size="icon-sm"
						type="submit"
						aria-label={chat.current.status === "streaming"
							? "Stop generation"
							: "Send message"}
						disabled={chat.current.status !== "streaming" &&
							((!input.trim() && !fileList?.length) || !config.settings.model)}
					>
						{#if chat.current.status === "streaming"}
							<Square />
						{:else}
							<ArrowUp />
						{/if}
					</InputGroup.Button>
				</div>
			</InputGroup.Addon>
		</InputGroup.Root>
	</form>
</div>
