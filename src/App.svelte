<script lang="ts">

	import Tab, {Icon, Label} from '@smui/tab';
  	import TabBar from '@smui/tab-bar';
	
	import Random from "./random";
	import About from "./About.svelte";
	import PoolEditor from './PoolEditor.svelte';
	import Lobby from './Lobby.svelte';
	import User from './User.svelte';


	var user=null;

	let active = "Profile";
</script>

<TabBar tabs={["Profile", "Champion Pool", "Game", "About"]} let:tab bind:active>
	<Tab {tab}>
		<Label>{tab}</Label>
	</Tab>
</TabBar>
<main>
	{#if active==="Profile"}
		<User bind:user={user}/>
	{:else if active==="Champion Pool"}
		<PoolEditor/>
	{:else if active==="Game"}
		<Lobby/>
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