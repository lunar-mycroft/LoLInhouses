<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import {Doc} from 'sveltefire';

    import Pool from './Pool.svelte';
    import SortedSet from '../behavior/sorted_set';
    import champs from '../champions.json';
    import type {Champion} from '../behavior/types'
    import type firebase from 'firebase';
    
    const dispatch = createEventDispatcher();

    function compare_champs(a: Champion, b: Champion): number {
        if (a.id>b.id) return 1;
        if (a.id<b.id) return -1;
        return 0;
    }

    export let uid = null;

    let all: SortedSet<Champion> = new SortedSet<Champion>(champs as Champion[], compare_champs);
    let included: SortedSet<Champion> = new SortedSet<Champion>([], compare_champs);
    let excluded: SortedSet<Champion> = all.difference(included);
    
    async function remove_champ(champ: Champion, ref: firebase.firestore.DocumentReference){
        swap_champ(included, excluded, champ);
        await refresh_lists(ref);
    }

    async function add_champ(champ: Champion, ref: firebase.firestore.DocumentReference){
        console.log(champ)
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
            champions: included.data
        })
    }

    function update_lists(data: firebase.firestore.DocumentData){
        included = new SortedSet<Champion>(data.champions, compare_champs)
        excluded = all.difference(included);
    }
    
</script>
<Doc path={'champ_pools/'+uid} on:data={(evt)=>update_lists(evt.detail.data)} let:ref>
<div id = "container">
    <div id = "included">
        <h2>Your {included.length} champion{included.length===1 ? '' : 's'}</h2>
        <Pool bind:champions={included.data} on:champ={async (evt)=>await remove_champ(evt.detail, ref)}/>
    </div>
    <div id = "excluded">
        <h2>Other champions {excluded.length}</h2>
        <Pool bind:champions={excluded.data} on:champ={async (evt)=>await add_champ(evt.detail, ref)}/>
    </div>
</div>
</Doc>
<style>
    #container{
        display: grid;
        grid-gap: 8px;
        grid-template-columns: 1fr 1fr;
        grid-template-areas: "left right";
    }

    #container div{
        border: 2px;
        border-color: #c89b3c;
        border-style: solid;
        text-align: center;
    }

    #included{
        grid-area: "left"
    }

    #excluded{
        grid-area: "right"
    }
</style>