Deploy e passos necessários para habilitar uploads e auth
=====================================================

Resumo
-----
Este projeto depende de Firebase Authentication, Firestore e Storage. Algumas ações precisam ser executadas manualmente ou via ferramentas `gcloud`/`gsutil`/`firebase-tools` porque exigem credenciais com permissões de projeto.

Passos que eu automatizei no repositório:
- `cors.json` — arquivo de configuração CORS para o bucket.
- `scripts/apply_cors.sh` — script que usa `gsutil` para aplicar `cors.json` ao bucket.
- `scripts/check_claims.js` — script Node para checar custom claims de um `UID` (requer `firebase-service-account.json`).

Instruções (execute localmente)
--------------------------------
1) Verifique arquivos criados:
   - `cors.json`
   - `scripts/apply_cors.sh`
   - `scripts/check_claims.js`

2) Adicione domínios autorizados no Firebase Console
   - Console > Authentication > Sign-in method > Authorized domains
   - Adicione `localhost` e `127.0.0.1` (ou seu host local)

3) Configurar CORS no bucket (requer Google Cloud SDK / gsutil)
   - Instale e autentique o gcloud/gsutil (ex: `brew install --cask google-cloud-sdk`)
   - Configure o projeto: `gcloud config set project conserta-barato`
   - Rode:
     ```bash
     chmod +x scripts/apply_cors.sh
     ./scripts/apply_cors.sh
     ```

4) Verificar e, se necessário, ajustar Storage Rules
   - Console > Storage > Rules
   - Se quiser restringir uploads a admins, utilize a regra que já está no repositório `storage.rules` e faça deploy com Firebase CLI:
     ```bash
     firebase deploy --only storage
     ```

5) Checar admin claim (opcional)
   - Coloque `firebase-service-account.json` na raiz (não comitar).
   - Rode:
     ```bash
     node scripts/check_claims.js <UID>
     ```

6) Teste local
   - Rode servidor local: `python3 -m http.server 8000`
   - Abra http://localhost:8000/admin/produtos.html
   - Faça login como admin e teste upload + salvar produto

Problemas comuns
----------------
- Se ainda houver erro CORS: verifique o bucket (Console > Storage) e se o bucket no `firebase-config.js` é exatamente o mesmo.
- Se receber 403 no upload: verifique Storage Rules e se o usuário está autenticado com claim `admin`.
- Se o `gsutil` não aplicar CORS: verifique permissões da conta usada pelo `gcloud`.

Se quiser, eu posso gerar e aplicar automaticamente as regras do Storage aqui, mas **não** consigo executar `gsutil` ou `firebase deploy` no seu projeto — você precisa rodar os comandos acima na sua máquina com as credenciais apropriadas.
