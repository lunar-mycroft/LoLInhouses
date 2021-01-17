<h2>{lobby_id}</h2>
<Button on:click={leave} variant="outlined" color="secondary"><Label>Leave</Label></Button>
{#if owner}
    <Button on:click={start}><Label>Start Game</Label></Button>
{/if}

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button, {Label} from '@smui/button';

    export let lobby_id: string = '';
    export let owner = false;

    

    const dispatch = createEventDispatcher();
    
    function leave(){
        dispatch('leave', null)
    }

    function start(){
        dispatch('start', null)
    }

</script>
<style lang="scss">

</style>