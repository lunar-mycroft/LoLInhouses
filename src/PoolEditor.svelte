<script lang="ts">
    import Pool from './Pool.svelte';
    import {auth_state} from "./firebase";
    import champs from './champions.json';
    let champions = champs;
    console.log(champions);
    let user;
    const unsubscribe = auth_state.subscribe(u => user = u);
</script>

<Pool bind:champions/>