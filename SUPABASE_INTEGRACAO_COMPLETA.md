# 📊 WANDA + Supabase - Integração Completa

## 🎯 O Que Vamos Fazer

Integrar os 36 posts WANDA + métricas de engajamento ao Supabase com:
- ✅ Banco de dados estruturado
- ✅ Dashboard para visualizar posts
- ✅ Tracking de views/likes/conversões
- ✅ Analytics avançado com views SQL
- ✅ Trending posts em tempo real

---

## 📋 PASSO 1: Criar Tabelas no Supabase

### 1.1 Abrir Supabase SQL Editor
```
https://app.supabase.com/project/cgpkfhrqprqptvehatad/sql
```

### 1.2 Copiar SQL
Abra o arquivo: **SUPABASE_SETUP.sql**

Copie TODO o conteúdo (Ctrl+A)

### 1.3 Colar e Executar
1. Cole no SQL Editor do Supabase
2. Clique em **"RUN"** (botão verde direita)
3. Aguarde a execução

**Resultado esperado:**
```
✅ Created table wanda_posts
✅ Created table wanda_analytics
✅ Created table wanda_trending
✅ Created view v_wanda_top_posts
✅ 100% success
```

---

## 🔧 PASSO 2: Verificar Credenciais

Abra **.env.local** e confirme:

```env
VITE_SUPABASE_URL=https://cgpkfhrqprqptvehatad.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Se não tiver ANON_KEY:**
1. Vá em Supabase Settings > API
2. Copie "anon (public)" key
3. Cole em .env.local

---

## 📥 PASSO 3: Ingererir Posts WANDA

Execute:
```bash
node scripts/wanda-supabase-ingest.mjs
```

**O que vai acontecer:**
```
📊 WANDA - Supabase Ingestion

✅ [1/36] Claude AI para Marketing
   Views: 232 | Eng: 11.0%
✅ [2/36] Automação de Relatórios...
   Views: 141 | Eng: 3.4%
...
✅ Resultado:
   Posts Ingeridos: 36
   Taxa de Sucesso: 100%
   
🎉 Dados salvos no Supabase!
```

---

## 📊 PASSO 4: Acessar os Dados

### Via Supabase Table Editor
```
https://app.supabase.com/project/cgpkfhrqprqptvehatad/editor/29537
```

1. Vá em **Table Editor**
2. Clique em **wanda_posts**
3. Veja todos os 36 posts com:
   - Views
   - Likes
   - Comments/Shares
   - Engagement rate
   - Conversion rate

---

## 📈 PASSO 5: Queries SQL Úteis

Vá em **SQL Editor** e execute:

### Top 10 Posts
```sql
SELECT 
  post_id, 
  subject, 
  creator, 
  tipo, 
  views, 
  engagement_rate,
  estimated_conversions
FROM wanda_posts
ORDER BY views DESC
LIMIT 10;
```

### Posts Trending (com ranking)
```sql
SELECT * FROM v_wanda_top_posts;
```

### Performance por Tipo
```sql
SELECT * FROM v_wanda_performance_by_type;
```

**Resultado:**
```
tipo          | total_posts | avg_views | avg_engagement
viral         | 12          | 242       | 8.8%
educational   | 12          | 327       | 11.0%
conversion    | 12          | 428       | 12.4%
```

### Performance por Criador
```sql
SELECT * FROM v_wanda_performance_by_creator;
```

### Filtrar por Tipo
```sql
SELECT * FROM wanda_posts WHERE tipo = 'conversion' ORDER BY views DESC;
```

---

## 🎯 INSIGHTS RÁPIDOS

Depois da ingestão, você terá acesso a:

✅ **Qual tipo de post performa melhor?**
→ Query: `SELECT tipo, AVG(engagement_rate) FROM wanda_posts GROUP BY tipo;`

✅ **Qual criador gera mais conversões?**
→ Query: `SELECT creator, SUM(estimated_conversions) FROM wanda_posts GROUP BY creator;`

✅ **Qual é o melhor horário?**
→ Query: `SELECT EXTRACT(HOUR FROM published_at) as hour, AVG(views) FROM wanda_posts GROUP BY hour;`

✅ **Posts que precisam de otimização?**
→ Query: `SELECT * FROM wanda_posts WHERE engagement_rate < 5 ORDER BY views ASC;`

---

## 🔄 AUTOMAÇÃO (Próxima Etapa)

Depois que tiver tudo no Supabase, podemos:

1. **Criar webhook** para atualizar métricas 24h
2. **Setup N8N** para publicar automaticamente + ingerir
3. **Dashboard em tempo real** com Supabase + Recharts

---

## 🚀 CHECKLIST

- [ ] Copiar SUPABASE_SETUP.sql
- [ ] Executar SQL no Supabase
- [ ] Confirmar .env.local com ANON_KEY
- [ ] Rodar: `node scripts/wanda-supabase-ingest.mjs`
- [ ] Acessar Table Editor e ver 36 posts
- [ ] Rodar queries SQL
- [ ] Revisar insights

---

## 🆘 TROUBLESHOOTING

### Erro: "permission denied"
→ Supabase RLS está ativado. Vá em **Settings > Auth > Row Level Security** e desative ou configure.

### Erro: "ANON_KEY não foi encontrado"
→ Preencha VITE_SUPABASE_ANON_KEY em .env.local

### Nenhum post foi ingerido
→ Certifique-se que wanda-tiktok-results.json existe. Se não, rode:
```bash
node scripts/wanda-tiktok-publisher.mjs
```

### Dados não aparecem no Table Editor
→ Atualize a página (F5) ou limpe cache

---

## 📞 PRÓXIMAS ETAPAS

Depois que estiver tudo aqui:
1. Setup N8N para automação
2. Criar dashboard web com Supabase + React
3. Webhook para tracking em tempo real

**Tudo pronto? Avisa quando terminar os passos!** 🚀
