#!/bin/bash

echo "🚀 SETUP AUTOMÁTICO DA API STARK"

# ============================================
# PASSO 1: Matar processo antigo na porta 3001
# ============================================
echo "🔪 Verificando porta 3001..."
PID=$(lsof -t -i :3001 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "   Matando processo $PID..."
    kill -9 $PID 2>/dev/null
    sleep 2
fi
echo "✅ Porta 3001 liberada"

# ============================================
# PASSO 2: Verificar .env
# ============================================
if [ ! -f .env ]; then
    echo "❌ .env não encontrado! Criando..."
    cat > .env << 'ENVEOF'
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://fgosozxvhbdhqigwzqih.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...1c2U
CORS_ORIGIN=http://localhost:5173,http://localhost:4173,https://totum-system.vercel.app,https://totum.pixelsystem.online
ENVEOF
    echo "✅ .env criado!"
else
    echo "✅ .env já existe"
fi

# ============================================
# PASSO 3: Carregar variáveis e subir API
# ============================================
echo "🚀 Subindo API Stark na porta 3001..."
echo "   (Mantenha este terminal aberto!)"
echo ""

export $(cat .env | grep -v '^#' | xargs)
npx tsx watch src/index.ts

