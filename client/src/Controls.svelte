<script>
  import { store } from './store';
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
  .root {
    padding: 1em;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
</style>

<div class="root">
  <form on:submit|preventDefault={onSubmit}>
    <input
      disabled={$store.authorized}
      placeholder="username"
      bind:value={username} />
    <button type="submit">Start</button>
  </form>
  <label>
    Show outline:
    <input type="checkbox" bind:checked={$store.showOutline} />
  </label>
</div>
