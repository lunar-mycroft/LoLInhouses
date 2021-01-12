<script lang="ts">

    import ImageList, {Item, ImageAspectContainer, Image, Supporting, Label} from '@smui/image-list';
    import Switch from '@smui/switch';

    import './styles/pool.scss';

    export let champions = [];

    function champ_url(champ){
        return "./img/"+champ.id+".jpg"
    }


</script>


<ImageList class="my-image-list" withTextProtection>
    {#each champions as champ, i }
    <Item>
        <ImageAspectContainer>
          <Image src={champ_url(champ)} alt={champ.name} />
        </ImageAspectContainer>
        <Supporting>
          <Label><strong>{champ.name}</strong> <span class="select-switch"><Switch bind:checked={champ.selected} /></span></Label>
        </Supporting>
    </Item>
    {/each}
</ImageList>

<style>
    .select-switch{
        text-align: right;
    }
</style>