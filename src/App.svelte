<script lang="ts">

	import Tab, {Icon, Label} from '@smui/tab';
  	import TabBar from '@smui/tab-bar';
	
	import Random from "./random";
	import About from "./About.svelte";
	import User from './User.svelte';
	import champions from "./champions.json";
	console.log(champions)

	var user=null;

	let active = "Profile";

	function foo(){
		alert(user.displayName)
	}
</script>

<TabBar tabs={user ? ["Profile", "Champion Pool", "Game", "About"] : ["Profile", "About"]} let:tab bind:active>
	<Tab {tab}>
		<Label>{tab}</Label>
	</Tab>
</TabBar>
<main>
	{#if active==="Profile"}
		<User bind:user={user}/>
	{:else if active==="About"}
		<About/>
	{/if}
	
</main>

<style>
	main {
		padding: 32px;
		color: white;
	}
</style>