<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import ImageList, {Item, ImageAspectContainer, Image, Supporting, Label} from '@smui/image-list';
    import '../styles/pool.scss';
    

    const disp = createEventDispatcher()

    export let champions = [];
    export let ban_disp = false;
    function champ_url(champ){
        return "img/"+champ.id+".jpg"
    }

    function select_champ(i: number){
        disp('champ', champions[i])
    }


</script>

{#if champions.length>0}
<ImageList class={ban_disp ? "ban-list" : "pool-list"} withTextProtection >
    {#each champions as champ, i }
    <Item on:click={()=>{select_champ(i)}}>
        <ImageAspectContainer>
          <Image src={champ_url(champ)} alt={champ.name} />
        </ImageAspectContainer>
        <Supporting>
          <Label><strong>{champ.name}</strong></Label>
        </Supporting>
    </Item>
    {/each}
</ImageList>
{:else}
<h2>There doesn't seem to be anything here :(</h2>
{/if}

<style type="text/scss">
    h2{
        text-align: center;
        color: white;
    }
</style>