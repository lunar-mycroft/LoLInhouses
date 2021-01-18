<script lang='ts'>
    
    import type firebase from 'firebase';
    import Button, {Label} from '@smui/button';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import List from '@smui/list';
    import {Doc} from 'sveltefire';
    import Random from '../behavior/random'
    import SortedSet from '../behavior/sorted_set'
    import type {LobbyData, ChampionPool, Champion} from '../behavior/types';
    import {leave_lobby, any_lobby, champ_pools} from '../behavior/firebase';
    import PlayerItem from "./PlayerItem.svelte";
    import LobbyControls from "./lobby/LobbyControls.svelte";
    import GameControls from "./lobby/GameControls.svelte"
    import JoinLobby from "./lobby/JoinLobby.svelte";
    import PlayerDisplay from "./lobby/PlayerDisplay.svelte";
    import BansDisplay from "./lobby/BansDisplay.svelte"
    export let uid: string | null = null;
    export var lobbys: firebase.firestore.CollectionReference;

    let ref: firebase.firestore.DocumentReference<LobbyData> | null = null;
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
            game_num: 0,
            seed: Math.random()*(1 << 30) | 0
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
        await leave_lobby(pid);
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
        let rng = new Random(data.seed) // TODO: get random from lobby variable
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
            if (players.length % 2 == 0 || i!=data.game_num % data.players.length)
                pool.push(players[i])
        }
            
        let rng = new Random(new Date().getTime() | 0);
        let j = pool.length >> 1;
        pool = rng.shuffle(pool)
        let r = pool.slice(0, j);
        let b = pool.slice(j, pool.length)
        
        await ref.update({
            seed: rng.between(0, 1<<30),
            red: r,
            blue: b
        })
    }
    async function finishGame(evt: CustomEvent<null>) {
        if (!(ref && owner())) return;
        await ref.update({
            red: [],
            blue: [],
            game_num: data.game_num+1
        })
        poolSets = null;
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
    {#if data && data.players.length>0 && teams_set()}{#await (async ()=>{
        let players = getIDs(data)
        await compute_pools(players)
        return pick_champs(players)
    })() }
        Loading picks...
    {:then picks} 
        
    
        <div id="leave-cancel">
            <GameControls 
                owner={owner()} 
                on:cancel={cancel} 
                on:leave={leave} 
                on:reroll={rollTeams} 
                on:finish={finishGame} 
                champion={(ref!=null && (data.red.includes(uid) || data.blue.includes(uid))) ? picks[uid] : undefined}
            />
        </div>
        
        <div id="blue"><List twoLine avatarList>{#each data.blue as pid}
            <PlayerItem pid={pid} champion={(team()=="blue") ? picks[pid] : null} me={uid==pid}/>
        {/each}</List></div>
        <div id="red"><List twoLine avatarList>{#each data.red as pid}
            <PlayerItem pid={pid} champion={team()=="red" ? picks[pid] : null} me={uid==pid}/>
        {/each}</List></div>
    {/await}{:else}
        <div id="info">
            <LobbyControls lobby_id={ref.id} owner={owner()} on:leave={leave} on:start={rollTeams}/>
        </div>
        <div id="players">
            <PlayerDisplay owner={owner()} on:ban={(evt)=>ban(evt.detail)} bind:uid players={getIDs(data)} />
        </div>
        {#if owner()}<div id="banned">
            <BansDisplay bans={getBans(data)} on:unban={(evt)=>unban(evt.detail)}/>
        </div>{/if}
    {/if}
</div>
</Doc>
{:else}
<div id="no-lobby">
    <JoinLobby bind:code on:join={join} on:host={host}/>
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