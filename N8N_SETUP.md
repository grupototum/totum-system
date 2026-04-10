# N8N - Automação WANDA

Configuração de workflows N8N para publicar posts WANDA automaticamente no TikTok e monitorar métricas.

## 🚀 Setup Inicial

### 1. Instalar N8N

**Opção A: Docker (Recomendado)**
```bash
docker run -it --rm -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

**Opção B: npm**
```bash
npm install -g n8n
n8n start
```

Acesse: http://localhost:5678

### 2. Conectar Integrations

#### Supabase Connection
1. **Node → Database → Supabase**
2. **Settings:**
   - Host: `db.cgpkfhrqprqptvehatad.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: `eM7eSSDdFZDp7xS8`

#### TikTok API Connection
1. **Node → HTTP Request**
2. **Settings:**
   - Base URL: `https://open.tiktokapis.com`
   - Headers: `Authorization: Bearer YOUR_ACCESS_TOKEN`

#### Email Connection (Gmail/SMTP)
1. **Node → Email Send**
2. **Settings:**
   - Service: Gmail / Custom SMTP
   - Email: seu@email.com
   - Senha: senha de app

## 📋 Workflows

### Workflow 1: Publicar Posts Diariamente

**Trigger:** Schedule (Daily, 19h - melhor horário de engajamento)

**Steps:**
1. **Get Unpublished Posts** (Supabase Query)
   ```sql
   SELECT * FROM wanda_posts 
   WHERE published_at IS NULL 
   LIMIT 3
   ```

2. **Publish to TikTok** (HTTP Request)
   ```
   POST /v1/post/publish/
   Body: {
     "title": "subject",
     "description": "hook + hashtags",
     "video_url": "video_file_url",
     "disable_comment": false,
     "disable_duet": false
   }
   ```

3. **Update Post Status** (Supabase Update)
   ```sql
   UPDATE wanda_posts 
   SET tiktok_video_id = response.video_id,
       published_at = NOW(),
       last_updated_at = NOW()
   WHERE post_id = 'post_X'
   ```

4. **Send Notification Email** (Email Send)
   - Para: seu@email.com
   - Subject: "✅ [3 posts] Publicados no TikTok"
   - Body: Resumo dos posts com links

### Workflow 2: Monitorar Métricas (Horário)

**Trigger:** Schedule (A cada 6 horas)

**Steps:**
1. **Get TikTok Video Stats** (HTTP Request)
   - Fetch views, likes, comments para cada post_id

2. **Update Analytics** (Supabase Insert)
   ```sql
   INSERT INTO wanda_analytics (post_id, views, likes, comments, recorded_at)
   VALUES (...)
   ```

3. **Calculate Trending** (Data Transform)
   - Scoring: views × (1 + engagement_rate)
   - Rank top 5

4. **Send Report** (Email)
   - Daily summary às 17h
   - Top posts, trending scores, engagement patterns

### Workflow 3: Alert de Viral Posts

**Trigger:** Every 15 minutes (Real-time monitoring)

**Steps:**
1. **Get Latest Metrics** (Supabase)
   ```sql
   SELECT * FROM wanda_posts 
   WHERE views > 1000 AND engagement_rate > 12
   ```

2. **Check if Trending** (Condition)
   - IF trending = true AND already_alerted = false

3. **Send Slack Alert** (ou email)
   - "🔥 Post viral! Views: 1,234 | Engagement: 14.5%"

## 🔧 Variáveis de Ambiente

Adicione ao N8N:

```
TIKTOK_CLIENT_ID=aw8z3pengb1ftasg
TIKTOK_CLIENT_SECRET=LCheWVcAs6msXVOB5ixXNwZZYAKyug7N
TIKTOK_ACCESS_TOKEN=<get_from_oauth>
SUPABASE_URL=https://cgpkfhrqprqptvehatad.supabase.co
SUPABASE_KEY=sb_publishable_gjkalaMwShdo-vS4p3zvnw_RHVvcMSr
EMAIL_GMAIL=seu@gmail.com
EMAIL_PASSWORD=<app_password>
```

## 📊 Dashboard N8N

Veja a evolução:
- **Execitons:** Quantas vezes rodou
- **Success Rate:** % de sucesso
- **Logs:** Erros e alertas
- **Metrics:** Posts publicados, views coletados, etc

## 🎯 Próximos Passos

1. ✅ Criar Workflow 1: Publicação automática
2. ✅ Criar Workflow 2: Monitoramento de métricas
3. ✅ Criar Workflow 3: Alertas de viral
4. ✅ Testar com 1 post antes de escalar para 36
5. ✅ Agendar para rodar a cada dia

## 🔗 Referências

- [N8N Docs](https://docs.n8n.io)
- [TikTok API Docs](https://developers.tiktok.com)
- [Supabase PostgreSQL](https://supabase.com/docs)
