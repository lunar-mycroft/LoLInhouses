<script lang='ts'>
    
    import type firebase from 'firebase';
    import Button, {Label} from '@smui/button';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import List, {Item, Text, Meta} from '@smui/list';
    import {Doc} from 'sveltefire';
    import Textfield from '@smui/textfield'
    import Random from '../behavior/random'

    import type {LobbyData, ChampionPool} from '../behavior/types';

    export let uid: string | null = null;
    export var lobbys: firebase.firestore.CollectionReference;
    let ref: firebase.firestore.DocumentReference | null = null;
    let code: string = ''
    var data: LobbyData;
    type t = firebase.firestore.DocumentData
    async function host(){
        let data: LobbyData = {
            owner: uid,
            banned: [],
            players: [],
            red: [],
            blue: [],
            spectator: 0
        }
        ref = await lobbys.add(data)
    }

    async function join() {
        let canidate = lobbys.doc(code.trim());
        let players: string[] = (await canidate.get()).data().players;
        players.push(uid)
        await canidate.update({
            players: players
        })
        ref = canidate;
        
    }

    async function leave(){
        if (!ref) return;
        if (data.owner===uid){
            if (!confirm("Are you sure you leave this lobby?  Since you're the owner, it will also delete it")) return
            await ref.delete();
            ref = null;
        } else {
            let i = data.players.indexOf(uid);
            data.players.splice(i, 1);
            await ref.update({
                players: data.players
            })
            ref = null;
        }
        code = '';
    }

    async function ban(pid: string){
        if (ref===null) return;
        if (pid===uid) {
            alert("You can't ban yourself idiot");
            return
        }
        if (!confirm("Are you sure you want to ban them?")) return
        let newData: firebase.firestore.DocumentData = {};
        let i = data.players.indexOf(pid);
        if (i>=0) {
            data.players.splice(i,1);
            newData.players = data.players
        }

        if (!data.banned.includes(pid)){
            data.banned.push(pid)
            newData.banned = data.banned
        }

        await ref.update(newData);
    }

    async function unban(pid: string){
        if (ref===null) return;
        if (!confirm("Are you sure you want to unban them?")) return
        
        let i = data.banned.indexOf(pid);
        if (i<0) return;
        data.banned.splice(i,1);
        await ref.update({
            banned: data.banned
        })
    }

    function owner(){
        return data.owner===uid
    }

    async function get_my_lobby(){
        if (uid===null) {
            ref = null;
            return
        }
        const owned_query = await lobbys.where("owner", "==", uid).limit(1).get();
        const member_query = await lobbys.where("players", "array-contains", uid).limit(1).get();
        const query = owned_query.empty ? member_query : owned_query;
        ref = query.empty ? null : query.docs[0].ref;;
    }
    
    async function roleTeams() {
        if (!ref) return;
        if (!data) return;
        let players = getIDs(data);
        let pool: string[] = [];
        for(let i=0; i<players.length;i++){
            if (players.length % 2 == 0 || i!=data.spectator)
                pool.push(players[i])
        }
            

        let rng = new Random(0);
        let j = pool.length >> 1;
        pool = rng.shuffle(pool)
        console.log(pool)
        let r = pool.slice(0, j);
        let b = pool.slice(j, pool.length)
        
        await ref.update({
            red: r,
            blue: b
        })

    }

    function getIDs(lob: LobbyData): string[]{
        try {
            return [lob.owner,...lob.players];
        } catch (e) {
            console.warn(e)
            return []
        }
    }

    function getBans(lob: LobbyData): string[]{
        try {
            return lob.banned;
        } catch (e) {
            console.warn(e)
            return []
        }
    }

    


</script>

{#await get_my_lobby()}
    loading...
{:then}
{#if ref}
<Doc path={'lobbys/'+ref.id} on:data={(evt)=>{data = evt.detail.data}}>
<div slot="fallback">
    <p>Couldn't load document.  This might be because your lobby was deleted.  Try reloading.</p>
</div>
<div id="lobby-container">
<div id="info">
    <h2>{ref.id}</h2>
    <Button on:click={leave} variant="outlined" color="secondary"><Label>Leave</Label></Button>
    {#if owner()}
    <Button on:click={()=>roleTeams()}><Label>Reroll</Label></Button>
    {/if}
</div>
<div id="players">
    <h3>Players</h3>
<DataTable >
<Head>
    <Row>
        <Cell>Name</Cell><Cell>Ban</Cell><Cell>Pool size</Cell>
        {#if owner()}
        <Cell>Ban player</Cell>
        {/if}
    </Row>
</Head>
<Body>{#each getIDs(data) as pid}
    
    <Doc path={'champ_pools/'+pid} let:data={playerData} let:ref={pRef}><Row>
        <Cell>{playerData.name}</Cell>
        <Cell>
            {#if playerData.ban===null}
            Nothing
            {:else}
            {playerData.ban.name}
            {/if}
        </Cell>
        <Cell>{playerData.champions.length}</Cell>
        {#if owner()}<Cell>{#if pid!=uid}<Button on:click={async ()=>{await ban(pid)}}>Ban</Button>{/if}</Cell>{/if}
        <div slot="fallback">Error loading the user data</div>
        
    </Row></Doc>
    
{/each}</Body>
</DataTable>
</div>
{#if owner()}
<div id="banned">
    <h3>Banned players</h3>
    {#if getBans(data).length>0}<DataTable>
    <Head><Row>
        <Cell>Name</Cell><Cell>Unban</Cell>
    </Row></Head>
    <Body>
        {#each getBans(data) as pid, i}
        <Doc path={'champ_pools/'+pid} let:data={playerData} let:ref={pRef}><Row>
        <Cell>{playerData.name}</Cell><Cell><Button on:click={async ()=>await unban(pid)}>Unban</Button></Cell>
        </Row></Doc>
        {/each}
       
    </Body>
    </DataTable>
    {:else}
    <h4>None!  Yay!</h4>
    {/if}
</div>
{/if}
</div>
</Doc>

{:else}
<div id="no-lobby">
<h2>You aren't in a lobby right now</h2>
<Button on:click={host} variant="outlined" color="secondary"><Label>Host</Label></Button> or
<Button on:click={join} variant="outlined" color="secondary"><Label>Join</Label></Button> with a <br>
<Textfield bind:value={code} label="code" style="min-width: 250px;"/>
</div>
{/if}
{/await}


<style type="text/scss">
#no-lobby {
    text-align: center;
}

#lobby-container{
    display:grid;
    grid-gap: 8px;
    grid-template-columns: 1fr 1fr;
    grid-template-areas: 
    "header header"
    "red blue"
    "players banned";
}

#info{
    grid-area: header;
    text-align: center
}
#players{
    grid-area: players;
}

#banned{
    grid-area: banned;
}
</style>