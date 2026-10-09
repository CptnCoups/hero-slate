<script lang="ts">
	// A sheet group whose heading folds it away. Folded content stays in the page,
	// hidden, so search can still find it and unfold it.
	import type { Snippet } from 'svelte';
	import { setCollapsed, sheetUi, slug } from '$lib/sheetUi.svelte';

	let { title, children }: { title: string; children: Snippet } = $props();

	const key = $derived(`group-${slug(title)}`);
	const collapsed = $derived(sheetUi.collapsed[key] === true);
</script>

<div class="group" data-collapse-key={key}>
	<h2 class="group-heading" data-group-heading>
		<button type="button" aria-expanded={!collapsed} onclick={() => setCollapsed(key, !collapsed)}>{title}</button>
	</h2>
	<div class="body" hidden={collapsed}>
		{@render children()}
	</div>
</div>

<style>
	.group,
	.body {
		display: grid;
		gap: var(--space-3);
	}

	.body[hidden] {
		display: none;
	}

	/* Fixed group labels: small, uppercase, in muted text. */
	.group-heading {
		margin: 0;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) 0;
		border: 0;
		background: none;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		cursor: pointer;
	}

	/* The chevron is drawn, not text, so the heading reads just its title. */
	button::after {
		content: '▾';
		font-size: 0.875rem;
		letter-spacing: 0;
	}

	button[aria-expanded='false']::after {
		content: '▸';
	}

	button:hover {
		color: var(--foreground);
	}

	button:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
