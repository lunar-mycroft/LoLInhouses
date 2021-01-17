<script lang='ts'>
    import {Doc} from 'sveltefire';
    import {Item, PrimaryText, SecondaryText, Text, Graphic} from '@smui/list';

    let prefix = window.location.href

    export var pid: string;
    export let champion = null

</script>

<Item ><Doc path={'champ_pools/'+pid} let:data let:ref>
    <Graphic style={'background-image: url('+prefix+'/img/'+(champion ? champion.id : 'unknown')+'.jpg);background-size: contain'} />
    <Text>
        <PrimaryText>{#if champion} {champion.name} {:else} ??? {/if}</PrimaryText>
        <SecondaryText>{data.name}</SecondaryText>
    </Text>
</Doc></Item>