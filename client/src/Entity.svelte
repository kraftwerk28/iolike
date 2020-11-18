<script lang="ts">
  export let entity;
  $: style = `
    width: ${entity.size}px;
    height: ${entity.size}px;
  `;
</script>

<style>
  .entity {
    border-radius: 50%;
  }
</style>

{#if entity}
  <div class="entity" {style} />
{/if}
