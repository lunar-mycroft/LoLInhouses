<script lang='ts'>
    
    import type firebase from 'firebase';
    import Button, {Label} from '@smui/button';
    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';
    import List, {Item, Text, Meta} from '@smui/list';
    import {Doc} from 'sveltefire';
    import Textfield from '@smui/textfield'

    import type {LobbyData, ChampionPool} from '../behavior/types';

    export let uid: string | null = null;
    export var lobbys: firebase.firestore.CollectionReference;
    let ref: firebase.firestore.DocumentReference | null = null;
    let code: string = ''
    var data: LobbyData;

    async function host(){
        let data: LobbyData = {
            owner: uid,
            banned: [],
            players: []
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
            //When I add subcollections, will need to delete those first
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


    function getIDs(lob: LobbyData): string[]{
        try {
            return [lob.owner,...lob.players];
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
    <Button on:click={leave} variant="outlined" color="secondary"><Label>Leave</Label></Button>
    <br>
    {ref.id}
    <br>
    <DataTable>
    <Head>
        <Row>
            <Cell>Name</Cell><Cell>Ban</Cell>
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
            <Cell>{#if owner() && pid!=uid}<Button on:click={async ()=>{await ban(pid)}}>Ban</Button>{/if}</Cell>
            <div slot="fallback">Error loading the user data</div>
            
        </Row></Doc>
        
    {/each}</Body>
    </DataTable>
</Doc>

{:else}
<h3>You aren't in a lobby right now</h3>
<Button on:click={host} variant="outlined" color="secondary"><Label>Host</Label></Button><br>or<br>
<Button on:click={join} variant="outlined" color="secondary"><Label>Join</Label></Button> with a <Textfield bind:value={code} label="code" style="min-width: 250px;"/>
{/if}
{/await}


