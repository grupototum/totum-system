# 🚀 TikTok API - Próximos Passos

## ✅ Credenciais Adicionadas!

Suas credenciais TikTok já estão em `.env.local`:
```
VITE_TIKTOK_CLIENT_ID=aw8z3pengb1ftasg
VITE_TIKTOK_CLIENT_SECRET=LCheWVcAs6msXVOB5ixXNwZZYAKyug7N
```

---

## 🎯 PASSO 1: Obter Access Token (2 minutos)

Execute este comando:
```bash
node scripts/tiktok-oauth.mjs
```

**O que vai acontecer:**
1. Um link de autorização será exibido
2. Copie e abra no navegador
3. Faça login com **@totum**
4. Autorize as permissões
5. O Access Token será salvo automaticamente

---

## ✅ PASSO 2: Testar Conexão (1 minuto)

```bash
node scripts/tiktok-api-test.mjs
```

**Esperado:**
```
✅ Conectado à TikTok API
👤 Usuário: @totum
📊 Quota: 10.000 requisições/dia
🎯 Pronto para publicar!
```

---

## 🎬 PASSO 3: Publicar 36 Posts (< 1 minuto)

```bash
node scripts/wanda-tiktok-real-publisher.mjs
```

**O que vai acontecer:**
- Lê os 36 posts do `wanda-output.json`
- Publica cada um na sua conta @totum
- Gera relatório com URLs dos posts
- Salva dados em `wanda-tiktok-published.json`

---

## 📊 PASSO 4: Monitorar Analytics

```bash
node scripts/wanda-monitor-realtime.mjs
```

Dashboard ao vivo com:
- Views em tempo real
- Likes, comentários, shares
- Top posts performando
- Projeções 30 dias

---

## 📁 Arquivos Criados para Você

| Arquivo | O que faz |
|---------|----------|
| `scripts/tiktok-oauth.mjs` | Obter Access Token |
| `scripts/tiktok-api-test.mjs` | Testar conexão |
| `scripts/wanda-tiktok-real-publisher.mjs` | **Publicar 36 posts** |
| `.env.local` | Config (já atualizado) |

---

## 🔥 COMECE AGORA!

**Copie e execute:**
```bash
# 1. Obter Access Token
node scripts/tiktok-oauth.mjs

# 2. Testar (quando terminar o passo 1)
node scripts/tiktok-api-test.mjs

# 3. Publicar 
node scripts/wanda-tiktok-real-publisher.mjs

# 4. Monitorar (opcional)
node scripts/wanda-monitor-realtime.mjs
```

---

## 🆘 Dúvidas?

**"Qual é o link de OAuth?"**
→ Execute `node scripts/tiktok-oauth.mjs` e será exibido

**"Como faço login com @totum?"**
→ Abra o link no navegador e faça login com a conta @totum

**"Já tenho o Access Token?"**
→ Está salvo no `.env.local` após o OAuth

**"Posso publicar em produção?"**
→ Depois da aprovação TikTok (1-2 semanas). Por enquanto é sandbox.

---

**Avisa quando estiver executando os passos! 🚀**
