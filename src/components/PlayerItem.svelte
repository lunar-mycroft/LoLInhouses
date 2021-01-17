<script lang='ts'>
    import {Doc} from 'sveltefire';
    import {Item, PrimaryText, SecondaryText, Text, Graphic} from '@smui/list';

    export var pid: string;
    export let champion = null
    export let me = false;

</script>

<Item ><Doc path={'champ_pools/'+pid} let:data let:ref>
    <Graphic style={'background-image: url(img/'+(champion ? champion.id : 'unknown')+'.jpg);background-size: contain'} />
    <Text>
        <PrimaryText><span class="{me?'me':'not-me'}">{#if champion} {champion.name} {:else} ??? {/if}</span></PrimaryText>
        <SecondaryText><span class="{me?'me':'not-me'}">{data.name}</span></SecondaryText>
    </Text>
</Doc></Item>

<style lang="scss">

span.me{
    font-weight: 800;
    color: #c89b3c;
}

</style>