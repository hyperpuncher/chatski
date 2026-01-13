<script lang="ts">
import { ModeWatcher } from "mode-watcher";
import "../layout.css";

let { children } = $props();
</script>

<ModeWatcher />

<main class="flex justify-center items-center h-screen">{@render children()}</main>
