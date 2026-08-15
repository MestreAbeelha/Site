import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// As chaves abaixo vêm de variáveis de ambiente (arquivo .env local, ou Secrets
// do GitHub Actions no deploy). Ver README.md para instruções de configuração.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ---------- autenticação (login individual por e-mail/senha) ---------- */
export function cadastrar(email, senha) {
  return createUserWithEmailAndPassword(auth, email, senha);
}
export function entrar(email, senha) {
  return signInWithEmailAndPassword(auth, email, senha);
}
export function sair() {
  return signOut(auth);
}
export function ouvirAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ---------- dados compartilhados da mesa ----------
   Tudo que os jogadores veem junto (fichas, histórico, iniciativa, fila de
   animação) fica em documentos na coleção "mesa". O ouvirShared usa
   onSnapshot, que empurra qualquer mudança pra todo mundo conectado quase
   instantaneamente — é isso que elimina o lag do polling antigo. */
export async function getShared(chave) {
  try {
    const snap = await getDoc(doc(db, "mesa", chave));
    return snap.exists() ? snap.data().value : [];
  } catch (e) {
    return [];
  }
}
export async function setShared(chave, valor) {
  try {
    await setDoc(doc(db, "mesa", chave), { value: valor, atualizadoEm: Date.now() });
  } catch (e) {
    /* noop */
  }
}
export function ouvirShared(chave, callback) {
  return onSnapshot(
    doc(db, "mesa", chave),
    (snap) => callback(snap.exists() ? snap.data().value : []),
    () => {}
  );
}

/* ---------- dados pessoais (perfil: nome + papel de cada conta) ---------- */
export async function getPersonal(uid) {
  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}
export async function setPersonal(uid, valor) {
  try {
    await setDoc(doc(db, "usuarios", uid), valor, { merge: true });
  } catch (e) {
    /* noop */
  }
}
