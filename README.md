# Mesa M&M3

Site da mesa de RPG (Mutantes & Malfeitores 3ª ed.) pra jogar com seus amigos.
Fichas, histórico e iniciativa ficam salvos na nuvem (Firebase) e sincronizam
em tempo real — qualquer pessoa loga de qualquer PC e vê tudo atualizado na hora.

## 1. Criar o projeto no Firebase (gratuito)

1. Acesse https://console.firebase.google.com e clique em **Adicionar projeto**.
   Dê um nome (ex: `mesa-mm3`) e conclua a criação (pode desativar o Google Analytics).
2. No menu lateral, vá em **Compilação > Authentication** → **Vamos começar** →
   ative o provedor **E-mail/senha**.
3. No menu lateral, vá em **Compilação > Firestore Database** → **Criar banco de dados**
   → escolha uma localização próxima (ex: `southamerica-east1`) → inicie em
   **modo de produção**.
4. Ainda no Firestore, vá na aba **Regras** e cole o conteúdo do arquivo
   [`firestore.rules`](./firestore.rules) deste repositório, depois clique em **Publicar**.
5. Volte em **Configurações do projeto** (ícone de engrenagem) → role até
   **Seus apps** → clique no ícone `</>` (Web) → dê um apelido (ex: `mesa-web`)
   → **não** precisa marcar Firebase Hosting → **Registrar app**.
6. Copie os valores de `firebaseConfig` que aparecem na tela (apiKey, authDomain,
   projectId, storageBucket, messagingSenderId, appId). Você vai usar no passo 3.

## 2. Colocar o código no GitHub

1. Crie um repositório novo no GitHub (pode ser público).
2. Suba os arquivos deste projeto pra ele:
   ```bash
   git init
   git add .
   git commit -m "Mesa M&M3"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

## 3. Configurar as chaves do Firebase no GitHub

O deploy automático (GitHub Actions) precisa das chaves do passo 1.6 como
**Secrets** do repositório (assim elas não ficam expostas no código-fonte):

1. No GitHub, vá em **Settings > Secrets and variables > Actions**.
2. Clique em **New repository secret** e crie, um por um, estes 6 secrets
   (com os valores copiados do Firebase):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## 4. Ativar o GitHub Pages

1. No GitHub, vá em **Settings > Pages**.
2. Em **Source**, escolha **GitHub Actions**.
3. Pronto — a cada `git push` na branch `main`, o workflow
   [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builda o
   site e publica automaticamente. Acompanhe o progresso na aba **Actions**
   do repositório. Quando terminar, o link do site aparece em
   **Settings > Pages** (algo como `https://seu-usuario.github.io/seu-repositorio/`).

Se você acabou de fazer o primeiro push antes de configurar os Secrets, é só
rodar o workflow de novo: aba **Actions** → selecione o workflow → **Run workflow**.

## 5. Testar e convidar a galera

Abra o link do site, crie sua conta (e-mail/senha), escolha se é Mestre ou
Jogador e comece a jogar. Manda o mesmo link pros seus amigos — cada um cria
a própria conta e escolhe seu papel.

## Rodando localmente (opcional, pra mexer no código)

```bash
npm install
cp .env.example .env   # preencha com as chaves do Firebase
npm run dev
```

## Estrutura

- `src/App.jsx` — toda a lógica e telas da mesa (fichas, rolagens, combate, histórico, iniciativa).
- `src/firebase.js` — conexão com o Firebase: login/cadastro e leitura/escrita em tempo real dos dados da mesa.
- `firestore.rules` — regras de segurança do banco de dados (cole no Console do Firebase).
- `.github/workflows/deploy.yml` — publica o site automaticamente no GitHub Pages a cada push.

## Sobre o "sem lag"

A versão original salvava os dados e ficava consultando o servidor a cada
poucos segundos (polling). Agora o site usa listeners em tempo real do
Firestore (`onSnapshot`): assim que alguém rola um dado ou edita uma ficha, a
mudança aparece na tela de todo mundo praticamente na hora, sem esperar
nenhum intervalo de atualização.
