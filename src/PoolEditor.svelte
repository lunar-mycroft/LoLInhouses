<script lang="ts">
    import Pool from './Pool.svelte';
    import {auth_state, champ_pools} from "./firebase";
    import SortedSet from './sorted_set';
    import champs from './champions.json';
    

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

    const unsubscribe = auth_state.subscribe(async (u)=>{
        pool = u===null ? null : champ_pools.doc(u.uid);
        let champ_list: Champion[] = (await pool.get()).data().champions
        included = new SortedSet<Champion>(champ_list, compare_champs);
        excluded = all.difference(included);
    });



    async function sync_included(){
        await pool.update({
                champions: included.data
            })
    }

    function swap_champ(a: SortedSet<Champion>, b: SortedSet<Champion>, champ: Champion){
        if (!a.remove(champ))return;
        b.add(champ);
    }

    function refresh_lists(){
        excluded = excluded;
        included = included;
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
</script>
<div id = "container">
    <div id = "included">
        <Pool bind:champions={included.data} on:champ={remove_champ}/>
    </div>
    <div id = "excluded">
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

    #container.div {

    }

    #included{
        grid-area: "left"
    }

    #excluded{
        grid-area: "right"
    }
</style>