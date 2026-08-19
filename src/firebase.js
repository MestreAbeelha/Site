import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

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

/* ---------- fichas (entidades) ----------
   Cada ficha é o SEU PRÓPRIO documento na coleção "entidades" (o id do
   documento é o id da entidade). Isso é importante: se fosse uma lista única
   guardada num documento só, editar a ficha de um jogador exigiria reescrever
   a lista inteira — e se dois jogadores editassem fichas diferentes quase ao
   mesmo tempo, a segunda escrita apagaria a mudança da primeira (a ficha
   "desaparecia"). Com um documento por ficha, editar uma nunca toca nas
   outras, então esse tipo de perda de dado não acontece mais. */
export function ouvirEntidades(callback) {
  return onSnapshot(
    collection(db, "entidades"),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => {}
  );
}
export async function salvarEntidade(entidade) {
  try {
    const { id, ...dados } = entidade;
    await setDoc(doc(db, "entidades", id), dados);
  } catch (e) {
    /* noop */
  }
}
export async function removerEntidadeDoc(id) {
  try {
    await deleteDoc(doc(db, "entidades", id));
  } catch (e) {
    /* noop */
  }
}

/* ---------- histórico ----------
   Pelo mesmo motivo, cada linha do histórico é um documento próprio na
   coleção "historico" (em vez de uma lista única): duas pessoas registrando
   uma rolagem ao mesmo tempo nunca fazem uma escrita apagar a outra. */
export function ouvirHistorico(callback) {
  const q = query(collection(db, "historico"), orderBy("criadoEm", "desc"), limit(150));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => {}
  );
}
export async function adicionarHistorico(entry) {
  try {
    await addDoc(collection(db, "historico"), { ...entry, criadoEm: Date.now() });
  } catch (e) {
    /* noop */
  }
}

/* ---------- iniciativa e fila de animação ----------
   Essas duas continuam como um documento único: normalmente só uma pessoa
   por vez mexe na ordem de iniciativa (o Mestre avançando o turno), então o
   risco de duas escritas colidindo é bem menor do que era com as fichas. */
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

/* ---------- migração automática (formato antigo → novo) ----------
   Versões anteriores guardavam fichas e histórico como uma lista única em
   "mesa/entidades" e "mesa/historico". Essa função roda uma vez, sozinha,
   assim que alguém abre o site: se a coleção nova ainda estiver vazia, ela
   copia os dados antigos pro formato novo (um documento por ficha/linha).
   Depois da primeira execução bem-sucedida ela não faz mais nada — é segura
   de deixar no código. */
export async function migrarDadosAntigos() {
  try {
    const jaTemEntidades = await getDocs(collection(db, "entidades"));
    if (jaTemEntidades.empty) {
      const antigo = await getDoc(doc(db, "mesa", "entidades"));
      const lista = antigo.exists() && Array.isArray(antigo.data().value) ? antigo.data().value : [];
      for (const ent of lista) {
        if (ent && ent.id) await setDoc(doc(db, "entidades", String(ent.id)), ent);
      }
    }
  } catch (e) {
    /* noop */
  }
  try {
    const jaTemHistorico = await getDocs(collection(db, "historico"));
    if (jaTemHistorico.empty) {
      const antigo = await getDoc(doc(db, "mesa", "historico"));
      const lista = antigo.exists() && Array.isArray(antigo.data().value) ? antigo.data().value : [];
      const cronologica = [...lista].reverse(); // a lista antiga vinha do mais novo pro mais antigo
      const base = Date.now() - cronologica.length;
      for (let i = 0; i < cronologica.length; i++) {
        const { id, ...resto } = cronologica[i] || {};
        await addDoc(collection(db, "historico"), { ...resto, criadoEm: base + i });
      }
    }
  } catch (e) {
    /* noop */
  }
}
