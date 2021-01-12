<script lang="ts">
    import './button.scss';
    import Button, {Label} from '@smui/button';
    import Textfield from '@smui/textfield'
    import {auth, champ_pools, auth_state} from "./firebase";
    
    
    export var user;
    let name = "";
	let clicked=0;
	
	
    
    const unsubscribe = auth_state.subscribe(u => user = u);

	async function create(){
		try {
			if (!name) return;
			await auth.signInAnonymously()
			await user.updateProfile({displayName: name})
			user = user; // Hack.  TODO: fix it.
			await champ_pools.doc(user.uid).set({
				champions: []
			})
		} catch (e) {
			console.log(e)
		}
		

	}


	async function remove(){
		if (user===null) return;
		try {
			await champ_pools.doc(user.uid).delete()
			await user.delete() 
		} catch (e) {
			console.log(e)
		}
		name = "";
	}
</script>


{#if user && user.displayName!=null}
	<h1>{user.displayName}</h1> 
	<Button variant="outlined"on:click={remove} class="button-highlight-secondary" color="secondary">logout</Button>
{:else}
	<Textfield variant="outlined" bind:value={name}/> <Button variant="outlined" on:click={create} color="secondary">login</Button>
{/if}


<style>	
    

    h1 {
        color: white;
        display: inline;
    }
    
</style>