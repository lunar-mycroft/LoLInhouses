<script lang='ts'>
    
    import type firebase from 'firebase';
    import Button, {Label} from '@smui/button';
    import List, {Item, Text} from '@smui/list';
    import {Doc} from 'sveltefire';
    import Textfield from '@smui/textfield'

    import type {LobbyData, ChampionPool} from '../behavior/types';

    export let uid: string | null = null;
    export var lobbys: firebase.firestore.CollectionReference;
    export var name;
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
    <List>{#each getIDs(data) as pid}
        <Item>
            <Doc path={'champ_pools/'+pid} let:data={playerData} let:ref={pRef}>
                {playerData.name}
                <div slot="fallback">Error loading the user data</div>
            </Doc>
        </Item>
    {/each}</List>
</Doc>

{:else}
<h3>You aren't in a lobby right now</h3>
<Button on:click={host} variant="outlined" color="secondary"><Label>Host</Label></Button><br>or<br>
<Button on:click={join} variant="outlined" color="secondary"><Label>Join</Label></Button> with a <Textfield bind:value={code} label="code" style="min-width: 250px;"/>
{/if}
{/await}


