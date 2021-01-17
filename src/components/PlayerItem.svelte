<script lang='ts'>
    import {Doc} from 'sveltefire';
    import {Item, Text} from '@smui/list';

    export var pid: string;

</script>

<Item><Doc path={'champ_pools/'+pid} let:data let:ref>
    <Text>{data.name}</Text>
</Doc></Item>