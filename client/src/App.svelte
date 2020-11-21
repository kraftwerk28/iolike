<script lang="ts">
  import { store } from './store';
  import GameScreen from './GameScreen.svelte';
  import { Player, Food } from 'common/entities';
  let username = '';

  function onSubmit() {
    const trimmed = username.trim();
    if (trimmed.length) {
      store.sendAuth(username);
      username = '';
    }
  }
  $: onlyPlayers = $store.entities.filter(e => e instanceof Player);
  $: foodCount = $store.entities.reduce(
    (acc, e) => e instanceof Food ? 1 : 0,
    0,
  );
</script>

<style>
  :global(body) {
    margin: 0;
  }
</style>

<form on:submit|preventDefault={onSubmit}>
  <input
    disabled={$store.authorized}
    placeholder="username"
    bind:value={username} />
</form>
<GameScreen />
<pre>
  <code>
    Players count: {onlyPlayers.length}
    {onlyPlayers
      .map(ent => `${ent.pos.fmt()} ${ent.vel?.fmt()}`)
      .join('\n')
    }
    Amount of food: {foodCount}
  </code>
</pre>
