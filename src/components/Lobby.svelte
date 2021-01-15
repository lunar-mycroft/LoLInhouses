<script lang='ts'>
    
    import type firebase from 'firebase';
    import Button, {Label} from '@smui/button';
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
        console.log(players, uid)
        players.push(uid)
        console.log(players)
        await canidate.update({
            players: players
        })
        ref = canidate;
        
    }

    async function leave(){
        if (!ref) return;
        if (data.owner===uid){
            await ref.delete();
        } else {
            console.log("leaving")
        }
        
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





</script>

{#await get_my_lobby()}
    loading...
{:then}
{#if ref}
<Doc path={'lobbys/'+ref.id} on:data={(evt)=>{data = evt.detail}}>
    {ref.id} {JSON.stringify(data)}
</Doc>
{:else}
<h3>You aren't in a lobby right now</h3>
<Button on:click={host} variant="outlined" color="secondary"><Label>Host</Label></Button><br>or<br>
<Button on:click={join} variant="outlined" color="secondary"><Label>Join</Label></Button> with a <Textfield bind:value={code} label="code" style="min-width: 250px;"/>
{/if}
{/await}


