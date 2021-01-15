<script lang="ts">

    import { FirebaseApp, User, Doc, Collection } from "sveltefire";
	import Button, {Label} from '@smui/button';
	
	import Tab, {Icon} from '@smui/tab';
  	import TabBar from '@smui/tab-bar';
    import Textfield from '@smui/textfield'
    import firebase from "firebase/app";
    import "firebase/firestore";
    import "firebase/auth";

	import About from "./components/About.svelte";
	import Lobby from "./components/Lobby.svelte";
	import PoolEditor from "./components/PoolEditor.svelte";



    let firebaseConfig = {
        apiKey: "AIzaSyBmskNn5aeKBE0q-_YBEYQm9J0-_eZrXQ0",
        authDomain: "among-friends-inhouses.firebaseapp.com",
        projectId: "among-friends-inhouses",
        storageBucket: "among-friends-inhouses.appspot.com",
        messagingSenderId: "2420558964",
        appId: "1:2420558964:web:02fc063f14b8fd862a9521"
    };
    firebase.initializeApp(firebaseConfig);
    const db: firebase.firestore.Firestore = firebase.firestore();
	const champ_pools = db.collection("champ_pools");
	const lobbys = db.collection("lobbys");

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
                await champ_pools.doc(user.uid).delete();
                await user.delete()
    
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
		<PoolEditor uid={user.uid} bind:name/>
		{:else if active==="Lobby"}
		<Lobby uid={user.uid} lobbys={lobbys} bind:name/>
		{:else if active==="About"}
		<About />
		{:else}
		<h1>Well, this should be unreachable, but it isn't :(</h1>
		{/if}
        
    </User>
</FirebaseApp>
</main>
<style>
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