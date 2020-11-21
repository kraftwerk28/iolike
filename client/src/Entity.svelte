<script>
  import { Entity, num2csscolor, Player, Food } from 'common';
  import { store } from './store';

  export let entity;

  let style = '';
  $: {
    let size = entity.size;
    if (entity instanceof Food) {
      size += 10;
    }
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
    /* mix-blend-mode: difference; */
    color: white;
    font-size: 2em;
    font-weight: bold;
  }
</style>

{#if entity}
  <div class="entity" {style} >
    {username}
  </div>
{/if}
