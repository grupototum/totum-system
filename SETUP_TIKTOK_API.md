# 🎬 Setup TikTok API - Guia Completo

## 📋 Status Atual
- ✅ Conta TikTok: **@totum** (conta principal)
- ✅ Modo: **Sandbox** (teste seguro)
- ✅ Escopo: **Full** (publicar + analytics + gerenciar)
- ⏳ Credenciais: Precisamos registrar a aplicação

---

## 🔧 PASSO 1: Registrar Aplicação TikTok

### 1.1 Acessar TikTok Developer Console
```
1. Ir para: https://developers.tiktok.com/
2. Clicar em "Get Started"
3. Fazer login com conta pessoal (NÃO a @totum ainda)
4. Aceitar termos
```

**Nota:** A conta pessoal é para DEVELOPER. A conta @totum é para PUBLISHER.

### 1.2 Criar Aplicação
```
1. Dashboard → Create App
2. Nome: "Totum Automation"
3. Descrição: "Automação de clientes para publicar conteúdo"
4. App Category: "Content Creation"
5. Clicar em "Create"
```

### 1.3 Escolher Tipo de Aplicação
```
Selecionar: ✅ "Server-to-Server"
Descrição: Para backend publishing automático
```

### 1.4 Configurar Informações
```
Website:        https://totum.com.br (ou seu domínio)
Description:    Sistema de publicação automática de conteúdo TikTok
Email:          israel@totum.com.br (ou seu email)
```

### 1.5 Aceitar Contrato
```
Marcar: ✅ "Agree to TikTok Developer Terms"
Clicar: "Create"
```

---

## 🔑 PASSO 2: Obter Credenciais

### 2.1 Copiar Client ID e Secret
```
Depois de criar, você verá:
┌─────────────────────────────────────┐
│ Client ID:                          │
│ xxxxxxxxxxxxxxxxxxxxxxxx            │
│                                     │
│ Client Secret:                      │
│ xxxxxxxxxxxxxxxxxxxxxxxx            │
└─────────────────────────────────────┘

👉 COPIE AMBOS (vamos usar em breve)
```

### 2.2 Legal: Sandbox Credentials
```
Você também receberá:
- Sandbox Access Token (para testar)
- Test TikTok Account (ou usar @totum)
```

---

## 🎯 PASSO 3: Adicionar Scopes (Permissões)

### 3.1 Ir em "Permissions"
```
Dashboard → App Details → Permissions → Edit
```

### 3.2 Selecionar Scopes
```
Marque todos:
✅ video.create          (publicar vídeos)
✅ video.read            (ler analytics)
✅ analytics.video.query (query analytics)
✅ user.info.read        (info do usuário)
✅ tt_user.manage        (gerenciar usuário)

Clicar: "Save"
```

---

## 🚀 PASSO 4: Setup Redirect URI (Importante!)

### 4.1 Adicionar Redirect URI
```
Settings → Redirect URIs → Add

URI: http://localhost:3000/auth/callback

Substituir:
- localhost por seu domínio se produção
- 3000 por sua porta
```

### 4.2 Qual URI usar?
```
Se testando localmente:
  http://localhost:3000/auth/callback

Se produção (Heroku, Railway, etc):
  https://seu-dominio.com/auth/callback
```

---

## 📝 PASSO 5: OAuth Connection (@totum Account)

### 5.1 Autorizar Conta @totum
```
Você precisa autorizar a conta @totum para publicar.

Depois que tiver Client ID + Secret, vou criar
um script que faz OAuth automaticamente.
```

### 5.2 Flow será:
```
1. Seu código gera um link de autorização
2. Você coloca o link no navegador
3. Login com @totum
4. Autorizar permissões
5. Receber Access Token
6. Salvar no arquivo .env
```

---

## ✅ PASSO 6: Colocar Credenciais no Projeto

### 6.1 Criar/Editar `.env.local`
```bash
cat > .env.local << 'EOF'
# TikTok API
VITE_TIKTOK_CLIENT_ID=seu_client_id_aqui
VITE_TIKTOK_CLIENT_SECRET=seu_client_secret_aqui
VITE_TIKTOK_REDIRECT_URI=http://localhost:3000/auth/callback

# Ou se já tiver access token:
VITE_TIKTOK_ACCESS_TOKEN=seu_access_token_aqui

# Modo sandbox ou production
VITE_TIKTOK_MODE=sandbox
EOF
```

### 6.2 Valores a preencher:
```
Você receberá do TikTok Console:
- Client ID          → VITE_TIKTOK_CLIENT_ID
- Client Secret      → VITE_TIKTOK_CLIENT_SECRET
- Access Token (@totum) → VITE_TIKTOK_ACCESS_TOKEN
```

---

## 📊 PASSO 7: Testar Conexão

### 7.1 Script de Teste
```bash
# Vou criar esse script depois
node scripts/tiktok-api-test.mjs
```

Output esperado:
```
✅ Conectado à TikTok API
👤 Usuário: @totum
📊 Quota: 10.000 requisições/dia
🎯 Pronto para publicar!
```

---

## 🎬 PRÓXIMA ETAPA: Integração com WANDA

Depois que tiver as credenciais, vou criar:

### `scripts/wanda-tiktok-real-publisher.mjs`
```javascript
Integration:
- Ler 36 posts de wanda-output.json
- Conectar TikTok API
- Publicar cada post
- Receber video_id do TikTok
- Salvar em banco de dados
- Rastrear views/likes/comments em tempo real
```

---

## 📋 CHECKLIST DO SETUP

- [ ] Acessar https://developers.tiktok.com/
- [ ] Fazer login (conta pessoal)
- [ ] Criar Aplicação: "Totum Automation"
- [ ] Escolher: "Server-to-Server"
- [ ] Copiar: Client ID
- [ ] Copiar: Client Secret
- [ ] Adicionar Redirect URI: `http://localhost:3000/auth/callback`
- [ ] Selecionar Scopes: video.create, video.read, analytics.video.query
- [ ] **Me enviar:** Client ID + Secret (ou guardar de forma segura)
- [ ] Será feito: OAuth com @totum account
- [ ] Será feito: Integração completa com WANDA

---

## 🚨 SAFETY NOTES

⚠️ **NUNCA compartilhe publicamente:**
- Client Secret
- Access Token
- Credenciais

✅ **Maneiras seguras de compartilhar:**
- 1Password / LastPass
- PM (direct message)
- Arquivo .env.local (nunca no git!)

---

## ❓ DÚVIDAS COMUNS

### P: Qual conta usar (pessoal vs @totum)?
**R:** 
- Pessoal: Para registrar APP no TikTok Console
- @totum: Para PUBLICAR (no script OAuth flow)

### P: Posso testar sem sandbox?
**R:** Sim, mas sandbox é mais seguro. Começamos com sandbox, depois migramos para production.

### P: Preciso de aprovação TikTok?
**R:** Para video.create em produção, SIM (1-2 semanas). Sandbox não precisa.

### P: Quanto custa?
**R:** TikTok API é grátis! Você paga pelos servidores (se usar cloud).

---

## 🎯 TIMELINE

### Hoje (Quando você enviar credenciais)
- Vou criar: `scripts/tiktok-api-test.mjs` (testar conexão)
- Vou criar: `scripts/wanda-tiktok-oauth.mjs` (fazer login @totum)

### Amanhã
- Integração completa: `scripts/wanda-tiktok-real-publisher.mjs`
- Publicar 36 posts de verdade no TikTok
- Rastreamento live de views

### Semana que vem
- Aprovar aplicação em produção (TikTok aprova)
- Migrar de sandbox para production
- Setup automação N8N

---

## 📞 PRÓXIMA AÇÃO

**Você precisa fazer:**
1. Abrir https://developers.tiktok.com/
2. Seguir os passos 1-5 acima
3. Me enviar: Client ID + Client Secret

**Eu vou fazer:**
1. Criar script OAuth para autorizar @totum
2. Criar publisher real que publica no TikTok
3. Testar tudo com sandbox
4. Integrar com WANDA

---

**Estou aqui para ajudar em cada passo! 🚀**

Você consegue seguir até qual ponto agora?
