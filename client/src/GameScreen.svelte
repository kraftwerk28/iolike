<script lang="ts">
  import { store } from './store';
  import Entity from './Entity.svelte';
  $: {
    console.log($store.entities);
  }
</script>

<style>
  .root {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border: 2px solid;
  }
</style>

<div class="root">
  {#each $store.entities as entity}
    <Entity {entity} />
  {/each}
</div>
