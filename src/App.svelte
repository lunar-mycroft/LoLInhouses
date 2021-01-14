<script lang="ts">

	import { FirebaseApp, User, Doc, Collection } from "sveltefire";
	import firebase from "firebase/app";
	import "firebase/firestore";
	import "firebase/auth";

	let firebaseConfig = {
		apiKey: "AIzaSyBmskNn5aeKBE0q-_YBEYQm9J0-_eZrXQ0",
		authDomain: "among-friends-inhouses.firebaseapp.com",
		projectId: "among-friends-inhouses",
		storageBucket: "among-friends-inhouses.appspot.com",
		messagingSenderId: "2420558964",
		appId: "1:2420558964:web:02fc063f14b8fd862a9521"
	};
	firebase.initializeApp(firebaseConfig);
</script>
<main>
<FirebaseApp {firebase}>
	<User let:user let:auth>
		Howdy 😀! User
		<em>{user.displayName}</em>
		<button on:click={() => auth.signOut()}>Sign Out</button>

      	<div slot="signed-out">
			<button on:click={() => auth.signInAnonymously()}>
			Sign In Anonymously
			</button>
		</div>
		<Doc path={'champ_pools/'+user.uid} let:data={pool} let:ref={poolRef}>
			<h1>{pool.name}</h1>
			<ul>
				{#each pool.champions as champion}
					<li>{champion.name}</li>
				{/each}
			</ul>
		</Doc>
	</User>
</FirebaseApp>
</main>
<style>
	main {
		padding: 32px;
		color: white;
	}
</style>