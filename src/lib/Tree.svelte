<script lang="ts">
	export let indent = 0;
	export let node: Node;
	let open = true;

  function toggleOpen() {
		open = !open;
	}

  function insertContent() {
    console.log(node.textContent)
  }
</script>

<style>
	div {
		cursor: pointer;
		user-select: none;
	}
</style>

<div style="padding-left: {indent}px" >
	<span on:click={insertContent}>{node.nodeName}: {node.nodeType}</span>
  <span on:click={toggleOpen}>{open ? "(open)" : "(closed)"}</span>
</div>

{#if open && node}
	{#each node.children as child}
		<svelte:self node={child} indent={indent + 24}/>
	{/each}
{/if}