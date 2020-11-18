<script lang="ts">
  import { store } from './store';
  import GameScreen from './GameScreen.svelte';

  let username = '';

  function onSubmit() {
    const trimmed = username.trim();
    if (trimmed.length) {
      store.sendAuth(username);
      username = '';
    }
  }
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
