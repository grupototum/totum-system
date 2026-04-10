# 📋 TikTok API Setup - Quick Checklist

## 🎯 Seu Próximo Passo

```
Você está aqui: ← Criamos guia + templates
Próximo:       → Registrar app TikTok
Depois:        → Me passar credenciais
Final:         → Integrar com WANDA + publicar de verdade
```

---

## ✅ Para Você Fazer AGORA

### 1. **Abrir TikTok Developer Console**
```
URL: https://developers.tiktok.com/
```

### 2. **Seguir Guia de Setup**
```
Arquivo: SETUP_TIKTOK_API.md
(Já criado neste projeto)
```

### 3. **Copiar Credenciais**
Depois de registrar a aplicação, você terá:
```
- Client ID
- Client Secret
- Access Token (@totum)
```

### 4. **Preencher .env.local**
```bash
# Copie isto:
cp .env.example .env.local

# Edite e preencha:
VITE_TIKTOK_CLIENT_ID=seu_valor
VITE_TIKTOK_CLIENT_SECRET=seu_valor
VITE_TIKTOK_ACCESS_TOKEN=seu_valor
```

### 5. **Testar Conexão**
```bash
node scripts/tiktok-api-test.mjs
```

---

## 📁 Arquivos Criados para Você

1. ✅ **SETUP_TIKTOK_API.md** - Guia passo a passo
2. ✅ **scripts/tiktok-api-test.mjs** - Script de teste
3. ✅ **.env.example** - Template com TikTok vars

---

## ⏭️ Depois que você me passar as credenciais, EU faço:

1. **OAuth Flow** → Autorizar @totum
2. **Real Publisher** → `wanda-tiktok-real-publisher.mjs`
3. **Live Posting** → Publicar 36 posts no TikTok
4. **Analytics Dashboard** → Track views/likes/conversões

---

## 🆘 Ajuda Necessária?

**Você tem dúvidas em qual passo?**
- [ ] Passo 1: Acessar TikTok Developer Console?
- [ ] Passo 2: Registrar aplicação?
- [ ] Passo 3: Copiar credenciais?
- [ ] Passo 4: Preencher .env.local?
- [ ] Passo 5: Rodar teste?

---

## 🚀 Estimativa de Tempo

| Etapa | Tempo |
|-------|-------|
| Setup TikTok App | 10-15 min |
| Preencher .env.local | 2 min |
| Testar conexão | 1 min |
| Você enviar credenciais | - |
| Eu criar publisher real | 20 min |
| **Publicar 36 posts de verdade** | **< 1 min!** |

**Total:** ~1 hora até ter tudo publicado no TikTok! 🎉

---

**Avisa quando tiver as credenciais prontas!** 🚀
