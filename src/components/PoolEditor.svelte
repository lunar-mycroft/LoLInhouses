<script lang="ts">
    import { onDestroy } from 'svelte';

    import Pool from './Pool.svelte';
    import {auth_state, champ_pools} from "../behavior/firebase";
    import {doc} from "rxfire/firestore";
    import SortedSet from '../behavior/sorted_set';
    import champs from '../champions.json';
    

    interface Champion{
        id: string,
        name: string;
    }

    function compare_champs(a: Champion, b: Champion): number {
        if (a.id>b.id) return 1;
        if (a.id<b.id) return -1;
        return 0;
    }

    let all: SortedSet<Champion> = new SortedSet<Champion>(champs, compare_champs);
    let included: SortedSet<Champion> = new SortedSet<Champion>([], compare_champs);
    let excluded: SortedSet<Champion> = all;
    
    let pool = null;
    let pool_subscription = null

    const auth_subscription = auth_state.subscribe((u)=>{
        if (pool_subscription!=null) pool_subscription.unsubscribe();
        if (u===null){
            pool = null;
            pool_subscription = null;
            
        } else {
            pool = champ_pools.doc(u.uid);
            pool_subscription = doc(pool).subscribe(update_included)
        }
        
    });

    function update_included(doc){
        update_from_list(doc.data().champions)
    }


    async function add_champ(evt){
        if (pool===null) return;
        let champ: Champion = evt.detail;
        swap_champ(excluded, included, champ);
        refresh_lists();
        try{
            await sync_included()
        } catch (e){
            console.error(e);
            swap_champ(included, excluded, champ);
            refresh_lists();
        }
        
    }

    async function remove_champ(evt){
        if (pool===null) return;
        let champ: Champion = evt.detail;
        swap_champ(included, excluded, champ);
        refresh_lists();
        try {
            await sync_included()
        } catch (e) {
            console.error(e);
            swap_champ(excluded, included, champ);
            refresh_lists();
        }
        
    }


    async function sync_included(){
        await pool.update({
                champions: included.data
            })
    }

    function swap_champ(a: SortedSet<Champion>, b: SortedSet<Champion>, champ: Champion){
        if (!a.remove(champ))return;
        b.add(champ);
    }

    function refresh_lists(){ //Exists to give a more snappy feel.
        excluded = excluded;
        included = included;
    }

    function update_from_list(list: Champion[]){
        included = new SortedSet<Champion>(list, compare_champs);
        excluded = all.difference(included);
    }

    onDestroy(()=>{
        auth_subscription.unsubscribe();
        if (pool_subscription!=null) pool_subscription.unsubscribe();
    })

    
</script>
<div id = "container">
    <div id = "included">
        <h2>Your {included.length} champion{included.length===1 ? '' : 's'}</h2>
        <Pool bind:champions={included.data} on:champ={remove_champ}/>
    </div>
    <div id = "excluded">
        <h2>Other champions {excluded.length}</h2>
        <Pool bind:champions={excluded.data} on:champ={add_champ}/>
    </div>
</div>

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