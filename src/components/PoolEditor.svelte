<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import {Doc} from 'sveltefire';

    import Switch from '@smui/switch';
    import Button, {Label, Icon} from '@smui/button';

    import Pool from './Pool.svelte';
    import SortedSet from '../behavior/sorted_set';
    import champs from '../champions.json';
    import type {Champion} from '../behavior/types'
    import type firebase from 'firebase';

    function compare_champs(a: Champion, b: Champion): number {
        if (a.id>b.id) return 1;
        if (a.id<b.id) return -1;
        return 0;
    }

    export let uid = null;
    export var name: string;

    let ban_mode = false;
    let ban: Champion | null = null
    let banDisplay: SortedSet<Champion> = new SortedSet<Champion>([{name:"None", "id": 'none'}], compare_champs);

    let valid = false;

    let all: SortedSet<Champion> = new SortedSet<Champion>(champs as Champion[], compare_champs);
    let included: SortedSet<Champion> = new SortedSet<Champion>([], compare_champs);
    let excluded: SortedSet<Champion> = all.difference(included);
    
    async function remove_champ(champ: Champion, ref: firebase.firestore.DocumentReference){
        swap_champ(included, excluded, champ);
        await refresh_lists(ref);
    }

    async function add_champ(champ: Champion, ref: firebase.firestore.DocumentReference){
        if (ban_mode){
            return await ban_champ(ref, champ)
        }
        swap_champ(excluded, included, champ);
        await refresh_lists(ref);
        
    }

    function swap_champ(a: SortedSet<Champion>, b: SortedSet<Champion>, champ: Champion){
        if (!a.remove(champ)) return;
        b.add(champ);
    }

    async function refresh_lists(ref: firebase.firestore.DocumentReference){ 
        //Exists to give a more snappy feel.
        excluded = excluded;
        included = included;
        await ref.update({
            //name: name,
            champions: included.data
        })
    }

    async function ban_champ(ref: firebase.firestore.DocumentReference, champ: Champion){
        banDisplay.data=[champ]
        await ref.update({
            ban: champ
        })
    }

    async function unban_champ(ref: firebase.firestore.DocumentReference, champ: Champion){
        banDisplay.remove(champ);
        banDisplay.add({name: "None", id: "None"})
        await ref.update({
            ban: null
        })
    }

    async function swap_lists(ref: firebase.firestore.DocumentReference){
        if (!ref) return;
        [included, excluded] = [excluded, included];
        try {
            await refresh_lists(ref)
        } catch (e) {
            console.error(e);
            [included, excluded] = [excluded, included];
        }
    
    }

    async function clear(ref: firebase.firestore.DocumentReference){
        let backup = [included, excluded];
        included = new SortedSet<Champion>([], compare_champs);
        excluded = all;
        try {
            await refresh_lists(ref)
        } catch (e) {
            console.error(e);
            [included, excluded] = backup;
        }

    }

    function update_lists(data: firebase.firestore.DocumentData){
        valid = data!=null;
        if (!valid) return;
        ban = data.ban;
        banDisplay.data= ban ? [ban] : [{
            name: "None",
            id: "none"
        }];
        included = new SortedSet<Champion>(data.champions, compare_champs)
        excluded = all.difference(included).difference(banDisplay);
    }
    
</script>

<Doc path={'champ_pools/'+uid} on:data={(evt)=>update_lists(evt.detail.data)} let:ref>
{#if valid}
<div id = "container">
    <div id="head">
        <h2>Your ban:</h2>
        <Pool bind:champions={banDisplay.data} on:champ={async (evt)=>unban_champ(ref, evt.detail)} ban_disp={true}/>
        <span id="pick">{#if !ban_mode}Pick mode{/if}</span><Switch bind:checked={ban_mode} /><span id="ban">{#if ban_mode}Ban mode{/if}</span>
        <br>
        <br>
        <Button on:click={()=>swap_lists(ref)} variant="outlined"><Icon class="material-icons">swap_horiz</Icon><Label>Swap Pools</Label></Button> 
        <Button on:click={()=>clear(ref)} variant="outlined"><Label>Clear</Label><Icon class="material-icons">clear</Icon></Button> 
    </div>
    <hr>
    <div id = "included" class="pool">
        <h2>Your {included.length} champion{included.length===1 ? '' : 's'}</h2>
        <Pool bind:champions={included.data} on:champ={async (evt)=>await remove_champ(evt.detail, ref)}/>
    </div>
    <div id = "excluded" class="pool">
        <h2>Other champions {excluded.length}</h2>
        <Pool bind:champions={excluded.data} on:champ={async (evt)=>await add_champ(evt.detail, ref)}/>
    </div>
</div>
{/if}
</Doc>


<style type="text/scss">
    #container{
        display: grid;
        grid-gap: 8px;
        grid-template-columns: 1fr 1fr;
        grid-template-areas:   
        "head head"
        "left right";

        .pool{
            border: 2px;
            border-color: #c89b3c;
            border-style: solid;
            text-align: center;
        }
    }

    #head{
        grid-area: head;
        font-size: 1.3em;
        text-align: center;
        

        span#pick{
            display: inline-block;
            width: 5em;
            margin-right: 0.85em;
        }
        span#ban{
            display: inline-block;
            width: 5em;
            margin-left: 0.85em;
        }
    }

    #included{
        grid-area: left
    }

    #excluded{
        grid-area: right
    }
</style>