<script lang="ts">
    import Switch from '@smui/switch';
    import Button, {Label, Icon} from '@smui/button';

    import Pool from './Pool.svelte';
    import SortedSet from '../behavior/sorted_set';
    import champs from '../champions.json';
    import type {Champion, ChampionPool} from '../behavior/types'
    import type firebase from 'firebase';

    function compare_champs(a: Champion, b: Champion): number {
        if (a.id>b.id) return 1;
        if (a.id<b.id) return -1;
        return 0;
    }

    type PoolRef = firebase.firestore.DocumentReference<ChampionPool>;
    let champ_none: Champion = {
        name: "None",
        id: "none"
    }

    export var ref: PoolRef;
    export var data: ChampionPool;

    let ban_mode = false;

    let banned: Champion[] = data.ban ? [data.ban] : [champ_none];
    let all: SortedSet<Champion> = new SortedSet<Champion>(champs as Champion[], compare_champs);
    let included: SortedSet<Champion> = new SortedSet<Champion>([], compare_champs);
    let excluded: SortedSet<Champion> = all.difference(included).difference(new SortedSet<Champion>(banned, compare_champs));
    
    async function swap_lists(){
        [included, excluded] = [excluded, included];
        try {
            await update_pool()
        } catch (e) {
            console.error(e);
            [included, excluded] = [excluded, included];
        }
    }

    async function clear(r: PoolRef){
        let backup = [included, excluded];
        included = new SortedSet<Champion>([], compare_champs);
        excluded = all;
        try {
            await update_pool()
        } catch (e) {
            console.error(e);
            [included, excluded] = backup;
        }
    }

    async function remove_champ(evt: CustomEvent<Champion>){
        swap_champ(included, excluded, evt.detail);
        rerender_lists()
        try {
           await update_pool()
        } catch (e) {
            console.error(e);
            swap_champ(excluded, included, evt.detail);
            rerender_lists()
        } 
    }

    async function add_champ(evt: CustomEvent<Champion>){
        if (ban_mode) return await ban(evt.detail);
        swap_champ(excluded, included, evt.detail);
        rerender_lists()
        try {
           await update_pool()
        } catch (e) {
            console.error(e);
            swap_champ(included, excluded, evt.detail);
            rerender_lists()
        } 
    }

    async function ban(champ){
        let old = banned[0]
        if (banned[0].id!=="none") {
            excluded.add(banned[0])
        }
        banned[0] = champ;
        rerender_lists()
        try{
            await ref.update({
                ban: banned[0]
            })
        } catch (e) {
            console.error(e);
            banned[0] = old;
            excluded.remove(old);
            rerender_lists()
        }
        
    }

    async function unban(evt: CustomEvent<Champion>){
        if (evt.detail.id!==banned[0].id) return;
        banned[0] = champ_none;
        if (evt.detail.id!=="none") excluded.add(evt.detail);
        rerender_lists()
        try {
            await ref.update({
                ban: null
            })
        } catch (e) {
            console.error(e);
            banned[0] = evt.detail;
            excluded.remove(evt.detail);
            rerender_lists()
        }
    }

    // Helper functions

    function swap_champ(a: SortedSet<Champion>, b: SortedSet<Champion>, champ: Champion){
        if (!a.remove(champ)) return;
        b.add(champ);
    }

    function rerender_lists(){
        [included, excluded] = [included, excluded];
    }

    async function update_pool(){
        await ref.update({
            champions: included.data
        });
    }
    
</script>

<div id = "container">
    <div id="head">
        <h2>Your ban:</h2>
        <Pool bind:champions={banned} on:champ={unban} ban_disp={true}/>
        <span id="pick">{#if !ban_mode}Pick mode{/if}</span><Switch bind:checked={ban_mode} /><span id="ban">{#if ban_mode}Ban mode{/if}</span>
        <br>
        <br>
        <Button on:click={()=>swap_lists(ref)} variant="outlined"><Icon class="material-icons">swap_horiz</Icon><Label>Swap Pools</Label></Button> 
        <Button on:click={()=>clear(ref)} variant="outlined"><Label>Clear</Label><Icon class="material-icons">clear</Icon></Button> 
    </div>
    <hr>
    <div id = "included" class="pool">
        <h2>Your {included.length} champion{included.length===1 ? '' : 's'}</h2>
        <Pool bind:champions={included.data} on:champ={remove_champ}/>
    </div>
    <div id = "excluded" class="pool">
        <h2>Other champions {excluded.length}</h2>
        <Pool bind:champions={excluded.data} on:champ={add_champ}/>
    </div>
</div>


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