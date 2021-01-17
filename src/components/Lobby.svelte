<script lang='ts'>
    
    import type firebase from 'firebase';
    import Button, {Label} from '@smui/button';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import List from '@smui/list';
    import {Doc} from 'sveltefire';
    import Textfield from '@smui/textfield'


    import Random from '../behavior/random'
    import SortedSet from '../behavior/sorted_set'
    import type {LobbyData, ChampionPool, Champion} from '../behavior/types';
    import {leave_lobby, any_lobby, champ_pools} from '../behavior/firebase';

    import PlayerItem from "./PlayerItem.svelte"

    export let uid: string | null = null;
    export var lobbys: firebase.firestore.CollectionReference;
    let ref: firebase.firestore.DocumentReference | null = null;
    let code: string = ''
    var data: LobbyData;
    let poolSets: {[field: string]: SortedSet<Champion>} | null = null;
    let picks: {[field: string]: Champion} | null = null;

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
        if (owner() && !confirm("Are you sure you want to leave the lobby?  You're the owner, so that will destroy it")) return;
        else if (teams_set() && !confirm("Are you sure you want to leave the lobby?  Teams have already been set!")) return;
        await leave_lobby(uid);
        poolSets = null;
        ref = null;
        data = null;
        code = '';
    }

    async function ban(pid: string){
        if (ref===null) return;
        if (pid===uid) {
            alert("You can't ban yourself idiot");
            return
        }
        if (!confirm("Are you sure you want to ban them?")) return

        await leave_lobby(uid);

        let newData: firebase.firestore.DocumentData = {};
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
        ref=ref;
    }

    function owner(){
        return data.owner===uid
    }

    async function compute_pools(players: string[]){
        let pools: ChampionPool[] = (await Promise.all(players.map((pid: string)=>champ_pools.doc(pid).get())))
            .map((snapshot)=>snapshot.data() as ChampionPool);
        let bans: SortedSet<Champion> = new SortedSet<Champion>(pools.map((p)=>p.ban).filter((champ)=>champ!=null), compare_champs);
        let res = {};
        for (let i=0; i<players.length; i++){
            res[players[i]] = (new SortedSet<Champion>(pools[i].champions, compare_champs).difference(bans));
            if (res[players[i]].length<=0) 
                throw pools[i].name
            
        }
        poolSets = res;
    }

    function pick_champs(players: string[]) {
        let rng = new Random(0) // TODO: get random from lobby variable
        let picked = new SortedSet<Champion>([], compare_champs);
        let res = {}
        for(let i=0; i<players.length;i++){
            let pid = players[i];
            let champ = rng.choice(poolSets[pid].difference(picked).data);
            picked.add(champ)
            res[pid] = champ
        }
        return res
    }
    
    async function rollTeams() { 
        if (!ref) return;
        if (!data) return;
        
        let players = getIDs(data);
        try{
            await compute_pools(players)
        } catch (e) {
            alert("Cannot form teams because "+e+" doesn't have enough champs")
        }
            
        let pool: string[] = [];
        

        for(let i=0; i<players.length;i++){
            if (players.length % 2 == 0 || i!=data.spectator)
                pool.push(players[i])
        }
            

        let rng = new Random(new Date().getTime() | 0);
        let j = pool.length >> 1;
        pool = rng.shuffle(pool)
        let r = pool.slice(0, j);
        let b = pool.slice(j, pool.length)
        
        await ref.update({
            red: r,
            blue: b
        })

    }

    async function cancel() {
        if (!(ref && owner())) return;
        await ref.update({
            red: [],
            blue: []
        })
        poolSets = null;
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

    async function get_my_lobby() {
        ref = await any_lobby(uid)
    }

    function teams_set(){
        let res =  (data.red.length>0 || data.blue.length>0);
        return res;
    }

    function team(){
        return data.blue.indexOf(uid)<0? "red" : "blue"
    }

    function compare_champs(a: Champion, b: Champion): number {
        if (a.id>b.id) return 1;
        if (a.id<b.id) return -1;
        return 0;
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
    {#if data.players.length>0 && teams_set()}{#await (async ()=>{
        let players = getIDs(data)
        await compute_pools(players)
        return pick_champs(players)
    })() }
        Loading picks...
    {:then picks} 
        
    
        <div id="leave-cancel">
            <Button on:click={leave} variant="outlined" color="secondary"><Label>Leave Lobby</Label></Button> 
            <Button on:click={cancel} variant="outlined" color="secondary"><Label>Cancel game</Label></Button>
            <br>
            <Button on:click={rollTeams} variant="outlined" color="secondary"><Label>Reroll</Label></Button>
        </div>
        
        <div id="blue"><List twoLine avatarList>{#each data.blue as pid}
            <PlayerItem pid={pid} champion={(team()=="blue") ? picks[pid] : null}/>
        {/each}</List></div>
        <div id="red"><List twoLine avatarList>{#each data.red as pid}
            <PlayerItem pid={pid} champion={team()=="red" ? picks[pid] : null}/>
        {/each}</List></div>
    {/await}{:else}
        <div id="info">
            <h2>{ref.id}</h2>
            <Button on:click={leave} variant="outlined" color="secondary"><Label>Leave</Label></Button>
            {#if owner()}
                <Button on:click={()=>rollTeams()}><Label>Start game</Label></Button>
            {/if}
        </div>
        <div id="players">
            <h3>Players</h3>
            <DataTable >
                <Head>
                    <Row>
                        <Cell>Name</Cell><Cell>Ban</Cell><Cell>Pool size</Cell>
                        {#if owner()}<Cell>Ban player</Cell>{/if}
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
        {#if owner()}<div id="banned">
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
        </div>{/if}
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
    "left right";
}

#info, #leave-cancel{
    grid-area: header;
    text-align: center
}
#players, #blue{
    grid-area: left;
}

#banned, #red{
    grid-area: right;
}
</style>