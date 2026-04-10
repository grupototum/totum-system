# N8N - Guia Prático: Publicar WANDA no TikTok Automaticamente

## 📋 Resumo Executivo

Você vai criar workflows N8N que:
- ✅ Publicam 1 post WANDA por dia (19h - horário de pico)
- ✅ Coletam métricas automaticamente (a cada 6 horas)
- ✅ Enviam relatórios por email
- ✅ Alertam quando algum post fica viral

**Tempo estimado:** 30 minutos de setup + testes

---

## 🚀 PASSO 1: Instalar N8N (5 min)

### Opção A: Docker (Mais fácil)

```bash
# Inicia N8N em docker
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Ou execute o script (mais fácil):
```bash
bash n8n-setup.sh
# Escolha opção 1 para Docker
```

### Opção B: npm (Local)

```bash
npm install -g n8n
n8n start
```

**Acesse:** http://localhost:5678

---

## 🔐 PASSO 2: Criar Credenciais (10 min)

No N8N, vá em **Credentials** e crie 3:

### 1️⃣ Supabase (PostgreSQL)

**Type:** PostgreSQL

**Dados:**
```
Host: db.cgpkfhrqprqptvehatad.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: eM7eSSDdFZDp7xS8
```

**Teste:** Click "Test Connection" → "Success"

### 2️⃣ TikTok API

**Type:** Custom HTTP Auth

**Headers:**
```
Authorization: Bearer {seu_access_token}
```

⚠️ Se não tem access_token ainda:
- Use o script: `node scripts/tiktok-oauth.mjs`
- Ou vá em: https://developer.tiktok.com/console/application/cgpkfhrqprqptvehatad

### 3️⃣ Email (Gmail/Outlook)

**Type:** Gmail (ou SMTP Custom)

**Para Gmail:**
1. Ativa 2-factor authentication
2. Gera "App Password" em: https://myaccount.google.com/apppasswords
3. Cola aqui:
```
Email: seu@gmail.com
Password: <app_password_de_16_caracteres>
```

---

## 🔧 PASSO 3: Importar Workflow (5 min)

### No N8N:

1. Click **"+"** (New Workflow)
2. Click **"..."** (Menu)
3. Click **"Import from file"**
4. Selecione: `n8n-workflow-wanda-publish.json`
5. Click **"Import"**

### Workflow Preview:

```
Schedule (19h)
    ↓
Get Unpublished Post (Supabase)
    ↓
Publish to TikTok (API)
    ↓
Update Post Status (Supabase)
    ↓
Send Email Notification
```

---

## ⚙️ PASSO 4: Configurar Nodes (10 min)

Cada "node" precisa de settings. Click em cada um:

### Node 1: Schedule Trigger
- **Trigger every:** 1 day
- **At:** 19:00 (horário de pico)

### Node 2: Get Unpublished Post
- **Supabase Credential:** Selecione a que criou
- A query já está pronta ✅

### Node 3: Publish to TikTok
- **Method:** POST
- **URL:** https://open.tiktokapis.com/v1/post/publish
- Headers + Body já estão prontos ✅

### Node 4: Update Post Status
- **Supabase Credential:** Selecione a que criou
- A query já coloca `published_at = NOW()` ✅

### Node 5: Send Email
- **From Email:** seu@gmail.com
- **To Email:** seu@gmail.com (ou outro)
- Mensagem já está pronta ✅

---

## 🧪 PASSO 5: Testar (5 min)

**Execute o workflow:**

1. Click **"Execute Workflow"** (botão play)
2. Vê o resultado em cada node
3. Checks:
   - ✅ WandaPost query retornou um post?
   - ✅ TikTok API retornou video_id?
   - ✅ Supabase updated com published_at?
   - ✅ Email foi enviado?

**Se algum falhar:** Veja o erro no node, ajusta credencial/query.

---

## 🚀 PASSO 6: Ativar Workflow (1 min)

Quando tudo funcionar:

1. Click **"Active"** (toggle no canto superior)
2. Aguarde "Workflow is active"
3. Pronto! Roda todo dia às 19h

---

## 📊 Monitorar Execução

No N8N, vá em **"Executions"** para ver:

```
✅ 2024-04-10 19:00 - Sucesso (Claude AI post publicado)
✅ 2024-04-11 19:00 - Sucesso (Automação post publicado)
❌ 2024-04-12 19:00 - Erro (TikTok API timeout)
```

Clica para ver logs detalhados.

---

## 💡 Dicas Avançadas

### Publicar múltiplos posts por dia

No **Schedule Trigger**, troque:
```
Every: 8 hours
At: 08:00, 14:00, 20:00
```

Agora publica 3x ao dia!

### Alertarquando post fica viral

Adicione um node após "Get Video Stats":

```
IF views > 500 AND engagement_rate > 12:
   SEND SLACK ALERT
```

### Monitorar métricas em tempo real

Crie segundo workflow com trigger **"Every 6 hours"**:

```
Schedule (a cada 6h)
    ↓
Get TikTok Video Stats (para cada post_id)
    ↓
Insert em wanda_analytics (Supabase)
    ↓
Calculate Trending Scores
    ↓
Send Report Email
```

Use queries em: `N8N_SQL_QUERIES.sql`

---

## 🎯 Próximos Passos

✅ Ativar publicação automática (agora)
✅ Monitorar primeiros resultados (semana)
✅ Ajustar horários conforme engagement
✅ Adicionar alertas de viral posts
✅ Criar dashboard de métricas
✅ Integrar com CRM/Email marketing

---

## 🆘 Troubleshooting

| Erro | Solução |
|------|---------|
| "Invalid TikTok Access Token" | Gera novo token: `node scripts/tiktok-oauth.mjs` |
| "Supabase permission denied" | Disable RLS: `ALTER TABLE wanda_posts DISABLE ROW LEVEL SECURITY` |
| "Email não envia" | Verifica app password Gmail (16 caracteres) |
| "Workflow não roda de madrugada" | N8N needs a machine awake. Use VPS / serveless |

---

## 📚 Recursos

- N8N Setup: [`N8N_SETUP.md`](N8N_SETUP.md)
- SQL Queries: [`N8N_SQL_QUERIES.sql`](N8N_SQL_QUERIES.sql)
- Workflow JSON: [`n8n-workflow-wanda-publish.json`](n8n-workflow-wanda-publish.json)
- Setup Script: [`n8n-setup.sh`](n8n-setup.sh)

---

**Avisa quando terminar o setup! Vamos rodar os testes juntos 🚀**
