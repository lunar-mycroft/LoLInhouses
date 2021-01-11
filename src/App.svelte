<script lang="ts">
	
	import Random from "./random";
	import User from './User.svelte';

	var user=null;
	function foo(){
		alert(user.displayName)
	}
</script>

<main>
	<User bind:user={user}/>
</main>

<style>
	main {
		text-align: center;
		margin: 16px;
		color: white;
	}
</style>