<script lang='ts'>
    import type firebase from 'firebase/app';
    import Button, {Label} from '@smui/button';
    import Textfield from '@smui/textfield'
    import {auth_state, champ_pools, lobbys} from "./firebase";
    import {doc} from "rxfire/firestore";
    import type {Subscription } from 'rxjs';

    let user = null


    class Manager {
        private ref_: firebase.firestore.DocumentReference | null = null;
        private sub_: Subscription;
        private snap_: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>;


        async remove_doc(){
            await this.ref_.delete()
            this.ref = null;
        }

        get data(){
            if (this.snap_!=null) return this.snap_.data();
            return null
        }

        get ref(){
            return this.ref_
        }

        set ref(ref: firebase.firestore.DocumentReference) {
            if (this.sub_!=null) this.sub_.unsubscribe();
            this.ref_ = ref;
            if (ref===null){
                this.snap_ = null;
                return;
            }
            this.sub_ = doc(ref).subscribe((s)=>{this.snapshot = s})
        }

        set snapshot(snapshot: firebase.firestore.DocumentSnapshot){
            console.log("here!")
            if (snapshot===undefined){
                this.ref=null;
                this.snap_ = null;
                this.ref = null;
            } else this.snap_ = snapshot;
        }
    }

    let manager = new Manager();

    let lobby_subscription = null;
    const auth_subscription = auth_state.subscribe(async (u)=>{
        user = u;
        manager.ref = await get_my_lobby()
    })
    

    async function host(){
        if (user===null) return;
        manager.ref = await lobbys.add({
            owner: user.uid,
            banned: [],
            players: []
        })
    }

    async function join(id: string) {

    }

    async function leave() {
        if (manager.ref===null) return;
        if (manager.data.owner==user.uid){
            await manager.ref.delete();
            manager.ref = null;
        } else {
            console.log("here's where we'd leave as a non-owner")
        }
    }

    async function get_my_lobby(){
        if (user===null) return null;
        const owned_query = await lobbys.where("owner", "==", user.uid).limit(1).get();
        const member_query = await lobbys.where("members", "array-contains", user.uid).limit(1).get();
        const query = owned_query.empty ? member_query : owned_query;
        if (query.empty) return null
        return query.docs[0].ref;
    }



</script>
{#if manager.ref==null}
<Button on:click={host}><Label>Host!</Label></Button>
{:else}
{manager.ref.id} <Button on:click={leave}><Label>leave!</Label></Button>
{/if}

