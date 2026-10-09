<script lang="ts">
	import type { Node } from './parse';
	import RichText from './RichText.svelte';
	import { isRollable } from '$lib/dice/roll';
	import { roller } from '$lib/dice/roller.svelte';

	// `label` names where a roll came from (a row title), for the roll display.
	let { nodes, label = undefined }: { nodes: Node[]; label?: string } = $props();
</script>

{#each nodes as node (node)}
	{#if node.kind === 'text'}
		{node.text}
	{:else if node.kind === 'strong'}
		<strong><RichText nodes={node.children} {label} /></strong>
	{:else if node.kind === 'em'}
		<em><RichText nodes={node.children} {label} /></em>
	{:else if node.kind === 'pill'}
		{#if isRollable(node.text)}
			<button
				type="button"
				class="pill"
				data-flavor={node.flavor}
				data-rollable
				aria-label={`Roll ${node.text}${label ? ` for ${label}` : ''}`}
				onclick={() => roller.roll(node.text, label)}
			>{#if node.flavor === 'dice'}🎲 {/if}{node.text}</button>
		{:else}
			<span class="pill" data-flavor={node.flavor}>{#if node.flavor === 'dice'}🎲 {/if}{node.text}</span>
		{/if}
	{/if}
{/each}

<style>
	.pill {
		display: inline-block;
		padding: 0.1em 0.4em;
		border: 1px solid var(--deep);
		border-radius: 0.25em;
		font-size: 0.875em;
		font-weight: 600;
		background-color: var(--tint);
		color: var(--deep);
		white-space: nowrap;
	}

	/* A rollable pill is a button: same look, plus a lift on hover and press. */
	button.pill {
		font-family: inherit;
		line-height: inherit;
		cursor: pointer;
		box-shadow: 0 2px 0 var(--deep);
		transform: translateY(-1px);
	}

	button.pill:hover {
		filter: brightness(1.1);
	}

	button.pill:active {
		box-shadow: none;
		transform: translateY(1px);
	}

	button.pill:focus-visible {
		outline: 3px solid var(--foreground);
		outline-offset: 2px;
	}
</style>
