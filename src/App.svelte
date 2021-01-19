<script lang="ts">

    import { FirebaseApp, User, Doc, Collection } from "sveltefire";
	
	import Button, {Label} from '@smui/button';
	import Tab, {Icon} from '@smui/tab';
  	import TabBar from '@smui/tab-bar';
    import Textfield from '@smui/textfield'
    import firebase from "firebase/app";
    import "firebase/firestore";
    import "firebase/auth";


	import {cleanup, champ_pools, lobbys} from "./behavior/firebase"

	import About from "./components/About.svelte";
	import Lobby from "./components/Lobby.svelte";
	import PoolEditor from "./components/PoolEditor.svelte";
import Pool from "./components/Pool.svelte";


	let name = '';
	
	let user: firebase.User;


	let active = "Champion Pool"

	function updateName(user: firebase.User){
		if (user.displayName) name = user.displayName;
		return name
	}


</script>
<main>
<FirebaseApp {firebase}>
    <User let:user let:auth>
		<div class="user-info">
            <h1>{updateName(user)}</h1>
            <Button variant="outlined" color="secondary" on:click={async ()=>{
				await cleanup(user.uid);
				await user.delete();
                name = '';
		    }}>Sign Out</Button>
		</div>
        <div slot="signed-out" class="user-info">
            <Textfield variant="outlined" bind:value={name}/> <Button variant="outlined" color="secondary"  on:click={async () => {
                if (!name) throw "can't log in with no name!!!";
                let cred = await auth.signInAnonymously();
                user = cred.user;
				await user.updateProfile({displayName: name})
                user = user; //hacky and ugly :(
                await champ_pools.doc(user.uid).set({
					name: updateName(user),
					ban: null,
                    champions: []
                })
                
                return cred
            }}>
            Sign In
			</Button>
			<hr>
			<About/>
		</div>
		<hr>
		<TabBar tabs={["Champion Pool", "Lobby", "About"]} let:tab bind:active>
			<Tab {tab}>
				<Label>{tab}</Label>
			</Tab>
		</TabBar>
		<hr>
		{#if active==="Champion Pool"}
		<Doc path={'champ_pools/'+user.uid} let:data let:ref>
			<div slot="loading">Loading Champion Pool...</div>
			<div slot="fallback">Failed to load Champion Pool</div>
			<PoolEditor data={data} ref={ref}/>
		</Doc>
		{:else if active==="Lobby"}
		<Lobby uid={user.uid} lobbys={lobbys}/>
		{:else if active==="About"}
		<About />
		{:else}
		<h1>Well, this should be unreachable, but it isn't :(</h1>
		{/if}
        
    </User>
</FirebaseApp>
</main>
<style type="text/scss">
    main {
        padding: 32px;
        color: white;
	}
	
	.user-info{
		text-align: center;
	}

    h1 {
        color: white;
        display: inline;
    }
</style>