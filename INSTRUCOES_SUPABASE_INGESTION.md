# 📋 INSTRUÇÕES — Ingestão Manual em Supabase

**Status:** ❌ Erro 401 (autenticação)  
**Próximo:** Ingesta manual via Admin Supabase

---

## 🔧 Como Ingerir Manualmente

### 1️⃣ Abrir Admin Supabase

```
https://app.supabase.com/project/cgpkfhrqprqptvehatad
```

### 2️⃣ Ir para SQL Editor

- Clique em **SQL Editor** (lado esquerdo)
-Clique **New Query**

### 3️⃣ Criar Tabela (se não existir)

```sql
CREATE TABLE IF NOT EXISTS rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  creator TEXT,
  category TEXT,
  insights JSONB,
  tags JSONB,
  ctas JSONB,
  trending_topics JSONB,
  summary TEXT,
  script_optimized TEXT,
  embedding VECTOR(384),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para busca por embedding (importante para RAG)
CREATE INDEX ON rag_documents USING ivfflat(embedding vector_cosine_ops) WITH(lists=100);
```

### 4️⃣ Inserir Dados Manualmente

Você pode:

**Opção A: Via SQL (rápido)**
```sql
-- Copiar dados do JSON gerado
-- Arquivo: data/outputs/transcription-processed-ollama.json

INSERT INTO rag_documents (
  title, content, creator, category, insights, tags, 
  ctas, trending_topics, summary, script_optimized, metadata
) VALUES
('Claude AI para Marketing', 'O Claude consegue fazer em 2 minutos...', 'Israel Lemos', 'other', '["automação", "análise"]', '["#claude", "#claudeai", "#ia"]', '[]', '["Claude AI"]', 'O Claude consegue fazer...', 'Hook: Claude AI...', '{"processedWith":"heuristics"}'),
-- ... repeat for 12 registros
;
```

**Opção B: Via Python (recomendado)**
```bash
# Instalar Supabase client
pip install supabase --upgrade

# Rodar script Python equivalente
python scripts/ingest-supabase-python.py
```

**Opção C: Via UI (manual)**
- Ir para **Table Editor**
- Selecione tabela `rag_documents`
- Clique **Insert Row**
- Preencha cada campo

### 5️⃣ Validar Ingestion

```sql
SELECT COUNT(*) as total FROM rag_documents;
-- Deve retornar: 12

SELECT title, category, tags FROM rag_documents LIMIT 3;
```

---

## 🤖 Próximo: WANDA + SCRIVO

Enquanto isso, os agentes estão prontos! Veja:
- `data/outputs/data-for-wanda-ollama.json` (12 registros)
- `data/outputs/data-for-scrivo-ollama.json` (12 registros)

Posso continuar com teste dos agentes agora.

---

**Nota:** O erro de autenticação sugere verificar:
- [ ] API key Supabase está correta?
- [ ] Tabela `rag_documents` existe?
- [ ] Permissões RLS estão habilitadas?
- [ ] CORS está configurado?
