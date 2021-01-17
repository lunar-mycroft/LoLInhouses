<h3>Banned players</h3>
{#if bans.length>0}<DataTable>
<Head><Row>
    <Cell>Name</Cell><Cell>Unban</Cell>
</Row></Head>
<Body>
    {#each bans as pid, i}
    <Doc path={'champ_pools/'+pid} let:data={playerData} let:ref={pRef}><Row>
    <Cell>{playerData.name}</Cell><Cell><Button on:click={()=>dispatch('unban', pid)}>Unban</Button></Cell>
    </Row></Doc>
    {/each}

</Body>
</DataTable>
{:else}
<h4>None!  Yay!</h4>
{/if}
<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import {Doc} from 'sveltefire';
    import Button, {Label} from '@smui/button';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';

    export let bans: string[] = []

    const dispatch = createEventDispatcher();
</script>

<style lang="scss">

</style>