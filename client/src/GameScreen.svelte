<script lang="ts">
  import { onMount } from 'svelte';
  import { Vec2 } from 'common';
  import { store } from './store';
  import Entity from './Entity.svelte';

  let divElem: HTMLDivElement;
  let bounds: DOMRect;
  $: {
    bounds = divElem?.getBoundingClientRect();
  }

  function onPointerMove(e) {
    const { clientX, clientY } = e;
    const [cx, cy] = [bounds.width / 2, bounds.height / 2];
    store.sendDirection(new Vec2(clientX - cx, clientY - cy));
  }
</script>

<style>
  .root {
    position: relative;
    /* top: 0; */
    /* right: 0; */
    /* bottom: 0; */
    /* left: 0; */
    border: 2px solid;
    width: 500px;
    height: 500px;
  }
  .world-border {
    border: 2px solid;
    position: absolute;
  }
</style>

<div bind:this={divElem} on:pointermove={onPointerMove} class="root">
  {#each $store.entities as entity}
    <Entity {entity} />
  {/each}
  <!--<div class="world-border" style={worldBorder} />-->
</div>
