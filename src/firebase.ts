import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { authState } from 'rxfire/auth';

let firebaseConfig = {
    apiKey: "AIzaSyBmskNn5aeKBE0q-_YBEYQm9J0-_eZrXQ0",
    authDomain: "among-friends-inhouses.firebaseapp.com",
    projectId: "among-friends-inhouses",
    storageBucket: "among-friends-inhouses.appspot.com",
    messagingSenderId: "2420558964",
    appId: "1:2420558964:web:02fc063f14b8fd862a9521"
  };

firebase.initializeApp(firebaseConfig);

export const auth: firebase.auth.Auth = firebase.auth();

export const db: firebase.firestore.Firestore = firebase.firestore();

export const champ_pools = db.collection("champ_pools");

export const auth_state = authState(auth);