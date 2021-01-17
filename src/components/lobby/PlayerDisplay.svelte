<h3>Players</h3>
<DataTable >
    <Head>
        <Row>
            <Cell>Name</Cell><Cell>Ban</Cell><Cell>Pool size</Cell>
            {#if owner}<Cell>Ban player</Cell>{/if}
        </Row>
    </Head>
    <Body>{#each players as pid}
        
        <Doc path={'champ_pools/'+pid} let:data={playerData} let:ref={pRef}><Row>
            <Cell>{playerData.name}</Cell>
            <Cell>
                {#if playerData.ban===null}
                    Nothing
                {:else}
                    {playerData.ban.name}
                {/if}
            </Cell>
            <Cell>{playerData.champions.length}</Cell>
            {#if owner}<Cell>{#if pid!=uid}<Button on:click={async ()=>{await ban(pid)}}>Ban</Button>{/if}</Cell>{/if}
            <div slot="fallback">Error loading the user data</div>
            
        </Row></Doc>
        
    {/each}</Body>
</DataTable>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import {Doc} from 'sveltefire';
    import Button, {Label} from '@smui/button';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';

    export let owner: boolean = false;
    export let uid: string = ''
    export let players: string[] = []

    const dispatch = createEventDispatcher();

    function ban(pid: string){
        dispatch('ban', pid)
    }
    
</script>

<style lang="scss">

</style>