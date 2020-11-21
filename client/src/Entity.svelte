<script lang="ts">
  import { Entity, num2csscolor, Player } from 'common';
  import { store } from './store';

  export let entity: Entity;

  let style = '';
  $: {
    const size = entity.size;
    const x = entity.pos.x - entity.size + $store.vpOffset.x;
    const y = entity.pos.y - entity.size + $store.vpOffset.y;
    const cl = num2csscolor(entity.color);

    style = `
      width: ${size * 2}px;
      height: ${size * 2}px;
      background: ${cl};
      left: ${x}px;
      top: ${y}px;
      line-height: ${size * 2}px;
    `;
  }
  $: username = entity instanceof Player ? entity.username : '';
</script>

<style>
  .entity {
    position: absolute;
    border-radius: 50%;
    text-align: center;
  }
</style>

{#if entity}
  <div class="entity" {style} >
    {username}
  </div>
{/if}
