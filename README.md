# CONSERTA BARATO — Site estático

Estrutura básica de site para a loja física CONSERTA BARATO. Projetado para ser responsivo e com integração para abrir conversas no WhatsApp.

Como usar

1. Atualize o número de WhatsApp em `js/app.js` substituindo `WHATSAPP_NUMBER` pelo número da loja no formato `+55...`.
2. Edite os produtos em `data/products.json` para alterar preços, imagens e disponibilidade.
3. Abra `index.html` no navegador ou sirva com um servidor estático (recomendado):

```bash
# Python 3
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

Personalização recomendada

- Substituir imagens de placeholder por fotos reais na pasta `images/`.
- Ajustar horários e endereço no rodapé e seção de contato.
- Integrar Google Maps trocando o placeholder por um iframe do Maps.
 - Substituir imagens de placeholder por fotos reais na pasta `images/`.
 - Ajustar horários e endereço no rodapé e seção de contato.
 - Integrar Google Maps trocando o placeholder por um iframe do Maps.

Otimizações de imagem

- Adicionei versões otimizadas da logo em `images/`:
	- `logo_clean.png` — PNG gerado sem fundo (original processado)
	- `logo_clean_opt.png` — PNG otimizado
	- `logo_clean@2x.png` — versão 2x para telas retina
	- `logo_clean.webp` e `logo_clean@2x.webp` — WebP otimizados
- Backup do original movido para `images/backup/Logo.jpeg`

SEO

O `index.html` já contém meta título e description; ajustar conforme necessário.

Suporte

Se quiser que eu faça ajustes visuais, adicionar produtos automaticamente via CMS ou criar um deploy (Netlify/Vercel), me diga o que prefere.

Publicação (recomendado)

Recomendo publicar o site em Netlify (grátis para sites estáticos, CDN e HTTPS automáticos). O projeto já contém `netlify.toml` configurado para publicar a pasta do repositório.

Passos rápidos para publicar no Netlify:

1. Crie uma conta em https://app.netlify.com/
2. Clique em "New site from Git" e conecte o repositório GitHub/GitLab/Bitbucket.
3. Defina o diretório de publicação como `/` (padrão) e deixe o campo build command vazio.
4. Conclua o deploy — Netlify fará o build e publicará automaticamente.

Se preferir publicar manualmente (upload): no painel do Netlify escolha "Sites -> New site -> Deploy manually" e arraste a pasta do projeto compactada.

Alternativa: Vercel ou GitHub Pages funcionam também — me diga qual prefere e eu adiciono instruções automáticas.

Deploy automático via GitHub Actions (opção recomendada)

Este repositório já contém um workflow do GitHub Actions em `.github/workflows/deploy-netlify.yml` que usa a CLI do Netlify para publicar automaticamente quando houver push na branch `main`.

Para habilitar:

1. Crie um Site no Netlify (ou use um existente) e anote o `Site ID` (disponível em Site settings -> Site information).
2. Gere um Personal Access Token em https://app.netlify.com/user/applications (ou em User settings -> Applications -> Personal access tokens) e copie o token.
3. No repositório GitHub, vá em Settings -> Secrets and variables -> Actions -> New repository secret e crie duas chaves:
	- `NETLIFY_AUTH_TOKEN` — o token gerado
	- `NETLIFY_SITE_ID` — o Site ID do Netlify
4. Faça push para `main`. O workflow será executado e fará o deploy automaticamente.

Se quiser, eu gero os comandos Git para inicializar o repositório local, criar a branch `main` e as instruções para push. Diga se quer que eu gere esses comandos prontos.
