<script lang="ts">
    import './button.scss';
    import Button, {Label} from '@smui/button';
    import Textfield from '@smui/textfield'
    import {auth} from "./firebase";
    import { authState } from 'rxfire/auth';
    
    export var user;
    let name = "";
    let clicked=0;
    
    const unsubscribe = authState(auth).subscribe(u => user = u);

	async function login(){
		try {
			if (!name){
				return
			}
			await auth.signInAnonymously()
			await user.updateProfile({displayName: name})
			user = user; // Hack.  TODO: fix it.
		} catch (e) {
			console.log(e)
		}
		

	}

	async function signout(){
		try {
			await user.delete() // Not logout, we don't want persistent users for now.
		} catch (e) {
			console.log(e)
		}
		name = "";
	}
</script>


{#if user && user.displayName!=null}
	<h1>{user.displayName}</h1> 
	<Button variant="outlined"on:click={signout} class="button-highlight-secondary" color="secondary">logout</Button>
{:else}
	<Textfield variant="outlined" bind:value={name}/> <Button variant="outlined" on:click={login} color="secondary">login</Button>
{/if}


<style>	
    

    h1 {
        color: white;
        display: inline;
    }
    
</style>