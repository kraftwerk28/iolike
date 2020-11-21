<script>
  import { Vec2 } from 'common';
  import { store } from './store';
  import Entity from './Entity.svelte';

  let divElem;
  let bounds;
  $: {
    bounds = divElem?.getBoundingClientRect();
  }
  let worldBorder;
  $: {
    const ws = $store.worldGeom.worldSize();
    worldBorder = `
      left: ${$store.vpOffset.x}px;
      top: ${$store.vpOffset.y}px;
      width: ${ws}px;
      height: ${ws}px;
      background: repeating-linear-gradient(
                    black,
                    transparent 1px,
                    transparent ${$store.worldGeom.chunkSize}px),
                  repeating-linear-gradient(
                    90deg,
                    black,
                    transparent 1px,
                    transparent ${$store.worldGeom.chunkSize}px);
    `;
  }
  $: rootStyle = `
    overflow: ${$store.showOutline ? 'visible' : 'hidden'};
    width: ${$store.camSize.x}px;
    height: ${$store.camSize.y}px;
  `;

  function onPointerMove(e) {
    const { clientX, clientY } = e;
    const [x, y] = [clientX - bounds.left, clientY - bounds.top];
    const [cx, cy] = [bounds.width / 2, bounds.height / 2];
    const dir = new Vec2(x - cx, y - cy);
    store.sendDirection(dir);
  }

  function onKeyDown(e) {
    if (e.key === ' ') {
      store.shoot();
    }
  }
</script>

<style>
  .root {
    position: relative;
    margin: auto;
    border: 2px solid;
    width: 500px;
    height: 500px;
  }
  .world-border {
    border: 2px solid;
    position: absolute;
  }
</style>

<svelte:window on:keydown={onKeyDown} />

<div
  bind:this={divElem}
  on:pointermove={onPointerMove}
  class="root"
  style={rootStyle}>
  {#each $store.entities as entity}
    <Entity {entity} />
  {/each}
  <div class="world-border" style={worldBorder} />
</div>
