{#if champion}
    <h3>You were asigned</h3>
    <ImageList class="ban-list" withTextProtection><Item>
        <ImageAspectContainer>
            <Image src={"img/"+champion.id+".jpg"} alt={champion.name} />
        </ImageAspectContainer>
        <Supporting>
            <Label><strong>{champion.name}</strong></Label>
        </Supporting>
    </Item></ImageList>
{:else}
    <h3>You are spectating this game</h3>
{/if}
<br>
<Button on:click={leave} variant="outlined" color="secondary"><Label>Leave Lobby</Label></Button>
{#if owner}
    <Button on:click={cancel} variant="outlined" color="secondary"><Label>Cancel game</Label></Button>
    <br><br>
    <Button on:click={reroll} variant="outlined" color="secondary"><Label>Reroll</Label></Button>
    <Button on:click={finish} variant="outlined" color="secondary"><Label>Finish game </Label></Button>
{/if}

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Button, {Label} from '@smui/button';
    import ImageList, {Item, ImageAspectContainer, Image, Supporting} from '@smui/image-list';

    import type {Champion} from "../../behavior/types";
    import '../../styles/pool.scss';

    export let owner = false;
    export let champion: Champion | undefined = undefined

    const dispatch = createEventDispatcher();
    
    function leave(){
        dispatch('leave', null)
    }

    function cancel(){
        dispatch('cancel', null)
    }

    function reroll(){
        dispatch('reroll', null)
    }

    function finish(){
        dispatch('finish', null)
    }
</script>



<style lang="scss">

</style>