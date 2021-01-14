<script lang='ts'>
    import type firebase from 'firebase/app';
    import Button, {Label} from '@smui/button';
    import Textfield from '@smui/textfield'
    import {auth_state, champ_pools, lobbys} from "./firebase";
    import {doc} from "rxfire/firestore";
    import type {Subscription} from 'rxjs';

    let user = null;
    let code = "";

    interface LobbyData{
        owner: string,
        banned: string[],
        players: string[]
    }

    class Manager {
        private ref_: firebase.firestore.DocumentReference | null = null;
        private sub_: Subscription | null = null;
        private snap_: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData> | null = null;
        private usubs_: Subscription[] = [];


        get isOwned(): boolean {
            if (user===null) return false;
            return this.data.owner == user.uid
        }

        get data(): LobbyData{
            if (this.snap_!=null) return this.snap_.data() as LobbyData;
            return null
        }

        get selfIndex(): number {
            if (user===null) return -2;
            let i = 0;
            for(; i<this.data.players.length; i++){
                if (this.data.players[i]===user.uid) return i
            }
            return -1;
        }

        get ref(): firebase.firestore.DocumentReference{
            return this.ref_
        }

        set ref(ref: firebase.firestore.DocumentReference | null) {
            if (this.sub_!=null) this.sub_.unsubscribe();
            this.ref_ = ref;
            if (ref===null){
                this.snap_ = null;
                this.sub_ = null
                return;
            }
            this.sub_ = doc(ref).subscribe((s)=>{this.snapshot = s})
        }

        set snapshot(snapshot: firebase.firestore.DocumentSnapshot){

            if (snapshot===undefined){
                this.ref=null;
                this.snap_ = null;
                this.ref = null;
            } else {
                this.snap_ = snapshot;
                for (var usub of this.usubs_) usub.unsubscribe();
                this.usubs_ = []
                for (var u of this.data.players){
                    doc(champ_pools.doc(u)).subscribe((s)=>{console.log(s.data())})
                }
            }
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

    async function join() {
        if (user===null) return;
        let canidate = lobbys.doc(code.trim())
        let snapshot = await canidate.get()
        let data: firebase.firestore.DocumentData = snapshot.data();
        
        let update: firebase.firestore.UpdateData = {
            players: [... data.players, user.uid]
        }

        await canidate.update(update)
        manager.ref = canidate;

    }

    async function leave() {
        if (manager.ref===null) return;
        if (manager.data.owner==user.uid){
            await manager.ref.delete();
            
        } else {
            let i = manager.selfIndex;
            let players: string[] = manager.data.players.map(u=>u);
            players.splice(i, 1);
            await manager.ref.update({
                players: players
            })
        }
        manager.ref = null;
    }

    async function get_my_lobby(){
        if (user===null) return null;
        const owned_query = await lobbys.where("owner", "==", user.uid).limit(1).get();
        const member_query = await lobbys.where("players", "array-contains", user.uid).limit(1).get();
        const query = owned_query.empty ? member_query : owned_query;
        if (query.empty) return null
        return query.docs[0].ref;
    }



</script>
{#if manager.ref==null}
You aren't in a lobby.  
<Button on:click={host} variant="outlined" color="secondary"><Label>Host</Label></Button>
 or <Button on:click={join} color="secondary" variant="outlined"><Label>Join</Label></Button>
 one with a 
<Textfield bind:value={code} label="code" style="min-width: 250px;"/>
{:else}
{manager.ref.id} <Button on:click={leave} variant="outlined" color="secondary"><Label>leave!</Label></Button>
{/if}

