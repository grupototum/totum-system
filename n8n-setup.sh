#!/bin/bash

# ════════════════════════════════════════════════════════════════════
# N8N - Setup Script para WANDA Automation
# ════════════════════════════════════════════════════════════════════

echo "🚀 N8N - Setup WANDA Automation"
echo "════════════════════════════════════════════════════════════════════"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo ""
echo "📦 Opções de Instalação:"
echo ""
echo "1️⃣  Docker (Recomendado - Setup automático)"
echo "2️⃣  npm (Local)"
echo ""
read -p "Escolha (1 ou 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🐳 Iniciando N8N com Docker..."
    echo "   Porta: 5678"
    echo "   Dados: ~/.n8n"
    echo ""
    docker run -it --rm \
        -p 5678:5678 \
        -v ~/.n8n:/home/node/.n8n \
        -e NODE_ENV=production \
        n8nio/n8n

elif [ "$choice" = "2" ]; then
    echo ""
    echo "📥 Instalando N8N via npm..."
    npm install -g n8n
    
    echo ""
    echo "✅ N8N instalado!"
    echo ""
    echo "Para iniciar:"
    echo "   n8n start"
    
else
    echo "❌ Opção inválida"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Setup completo!"
echo ""
echo "🔗 Acesse: http://localhost:5678"
echo ""
echo "📋 Próximos passos:"
echo "   1. Criar conta no N8N"
echo "   2. Importar workflow: n8n-workflow-wanda-publish.json"
echo "   3. Configurar Credenciais (Supabase, TikTok, Email)"
echo "   4. Ativar workflow"
echo ""
echo "📚 Guia: Veja N8N_SETUP.md"
echo "════════════════════════════════════════════════════════════════════"
