<script lang='ts'>
    import {Doc} from 'sveltefire';
    import {Item, PrimaryText, SecondaryText, Text} from '@smui/list';

    export var pid: string;
    export let champion = null

</script>

<Item ><Doc path={'champ_pools/'+pid} let:data let:ref>
    <Text>
        <PrimaryText>{#if champion} {JSON.stringify(champion)} {:else} ??? {/if}</PrimaryText>
        <SecondaryText>{data.name}</SecondaryText>
    </Text>
</Doc></Item>