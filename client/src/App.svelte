<script>
  import { onMount } from 'svelte';
  import { store } from './store';
  import GameScreen from './GameScreen.svelte';
  import Controls from './Controls.svelte';
  import { Player, Food } from 'common/entities';

  $: onlyPlayers = $store.entities.filter(e => e instanceof Player);
  $: foodCount = $store.entities.reduce(
    (acc, e) => acc + (e instanceof Food ? 1 : 0),
    0,
  );
  onMount(() => {
    window.addEventListener('pointerdown', console.warn);
  });
</script>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
  }
</style>

<Controls />
<GameScreen />

<pre>
   <code>
    Players count: {onlyPlayers.length}
    {onlyPlayers
      .map((ent) => `${ent.pos.fmt()} ${ent.vel.fmt()}`)
      .join('\n')
    }
    Amount of food: {foodCount}
  </code>
</pre>
