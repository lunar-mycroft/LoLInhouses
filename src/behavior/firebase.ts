import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

let firebaseConfig = {
    apiKey: "AIzaSyBmskNn5aeKBE0q-_YBEYQm9J0-_eZrXQ0",
    authDomain: "among-friends-inhouses.firebaseapp.com",
    projectId: "among-friends-inhouses",
    storageBucket: "among-friends-inhouses.appspot.com",
    messagingSenderId: "2420558964",
    appId: "1:2420558964:web:02fc063f14b8fd862a9521"
};

firebase.initializeApp(firebaseConfig);


export const db: firebase.firestore.Firestore = firebase.firestore();

export const champ_pools = db.collection("champ_pools");
export const lobbys = db.collection("lobbys");
export const teams = db.collection("teams");

type DocRefFuture = Promise<firebase.firestore.DocumentReference | null>

async function first_result(q: firebase.firestore.Query): DocRefFuture {
    
    let snapshot = await q.get();
    return snapshot.empty ? null : snapshot.docs[0].ref
}

export function owned_lobby(uid: string): DocRefFuture {
    return first_result(lobbys.where("owner", "==", uid).limit(1))
}

export function joined_lobby(uid: string): DocRefFuture {
    return first_result(lobbys.where("players", "array-contains", uid).limit(1))
}

export async function any_lobby(uid: string): DocRefFuture {
    let [owned, joined] = await Promise.all([owned_lobby(uid), joined_lobby(uid)])
    return owned || joined
}

function remove_from_array<T>(arr: T[], target: T){
    let i = arr.indexOf(target);
    if (i<0) return;
    arr.splice(i, 1)
}


export async function leave_lobby(uid: string) {
    let [owned_l, joined_l] = await Promise.all([owned_lobby(uid), joined_lobby(uid)])
    let owned = owned_l!=null;
    let lobby = owned_l || joined_l
    if (lobby===null) return;

    if (owned){
        await lobby.delete() // Delete the lobby;
    } else {
        // Remove yourself from the game players lists
        let snapshot = await lobby.get();
        let players: string[] = snapshot.data().players;
        let red: string[] = snapshot.data().red;
        let blue: string[] = snapshot.data().blue;
        remove_from_array(players, uid);
        remove_from_array(red, uid);
        remove_from_array(blue, uid)

        let ud = {
            players: players,
            red: red,
            blue: blue
        };

        await lobby.update(ud)
        
    }
    
}

export async function cleanup(uid: string){
    await leave_lobby(uid);
    await champ_pools.doc(uid).delete()
}