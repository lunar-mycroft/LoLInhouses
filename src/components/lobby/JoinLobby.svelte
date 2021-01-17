<h2>You aren't in a lobby right now</h2>
<Button on:click={host} variant="outlined" color="secondary"><Label>Host</Label></Button> or
<Button on:click={join} variant="outlined" color="secondary"><Label>Join</Label></Button> with a <br>
<Textfield bind:value={code} label="code" style="min-width: 250px;"/>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button, {Label} from '@smui/button';
    import Textfield from "@smui/textfield";

    export let lobby_id: string = '';
    export let owner: boolean = false;
    export let code: string = '';

    

    const dispatch = createEventDispatcher();
    
    function host(){
        dispatch('host', null)
    }

    function join(){
        dispatch('join', null)
    }

</script>
<style lang="scss">

</style>