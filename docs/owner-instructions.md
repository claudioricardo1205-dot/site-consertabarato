**Gerenciamento de Clientes, Orçamentos e Pedidos**

- Painel admin: acesse `/admin/` (requer usuário administrador do Firebase Auth). Ali você visualiza todos os `quotes` e `orders` em tempo real.
- Clientes: estão salvos em Firestore na coleção `customers`. Você pode editar dados pelo Firebase Console > Firestore ou implementar edição no painel admin.
- Orçamentos recebidos via site: salvos em `quotes` com campo `uid` quando o cliente estiver logado. No painel admin você pode marcar `handled:true`.
- Compras (`orders`) também são armazenadas em Firestore; o painel permite marcar como enviado.

Segurança recomendada (Firestore Rules)

1) Regras básicas para produção (apenas usuários autenticados podem ler/escrever seus próprios dados):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /customers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /quotes/{doc} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null && (resource.data.uid == request.auth.uid || request.auth.token.admin == true);
    }
    match /orders/{doc} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null && (resource.data.uid == request.auth.uid || request.auth.token.admin == true);
    }
    match /products/{doc} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /services/{doc} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

2) Para conceder acesso admin a um usuário, use Custom Claims via Firebase Admin SDK (ex.: `auth.setCustomUserClaims(uid, {admin:true})`).

Backup e migração

- O script `scripts/migrate_products_to_firestore.js` migra `data/products.json` e `data/services.json` para Firestore usando uma Service Account.
- Faça backup manual exportando coleções pelo Firebase Console antes de alterações em massa.

Regras recomendadas (arquivos no projeto)

- `firestore.rules` — regras sugeridas para Firestore (leitura pública para `products` e `services`, escrita restringida a admins):

```
// see firestore.rules in project root
```

- `storage.rules` — regras sugeridas para Firebase Storage (imagens públicas leitura; uploads apenas por admins; validação de tipo e tamanho):

```
// see storage.rules in project root
```

Como aplicar as regras (via Firebase CLI)

1. Instale e configure o Firebase CLI (se ainda não tiver):

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase init storage
```

2. Coloque os arquivos `firestore.rules` e `storage.rules` na raiz do seu projeto (já estão neste repositório). Para subir as regras:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

3. Teste as regras no Emulator (recomendado antes do deploy):

```bash
firebase emulators:start --only firestore,storage,auth
```

Como conceder permissão de administrador a um usuário

1. Crie o usuário no Firebase Console (Authentication → Users) ou registre via aplicativo.
2. Obtenha o `uid` do usuário e rode (localmente, com `firebase-service-account.json` disponível):

```bash
npm install firebase-admin
node scripts/set_admin_claim.js <USER_UID>
```

Migração de dados para Firestore

1. Gere `firebase-service-account.json` no Firebase Console → Project settings → Service accounts → Generate new private key.
2. Coloque o arquivo na raiz do projeto (não comite).
3. Rode o script de migração:

```bash
npm install firebase-admin
node scripts/migrate_products_to_firestore.js
```

4. Verifique as coleções `products` e `services` no Firebase Console → Firestore.

Testes pós-migração

- Teste leitura pública: abra o site público e confirme que os produtos aparecem.
- Teste painel: faça login com um usuário admin e verifique CRUD de produtos/serviços e upload de imagens.

Se quiser, eu me encarrego de executar a migração aqui (você precisa me fornecer `firebase-service-account.json` via upload) ou eu posso guiar você passo-a-passo para executar localmente.

Se quiser, eu adiciono fluxos automáticos para exportar `quotes`/`orders` em CSV semanalmente via Cloud Function. 
