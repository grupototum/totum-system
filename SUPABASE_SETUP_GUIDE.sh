#!/bin/bash

# SUPABASE - Quick Setup Guide
# 
# Este script mostra passo a passo como setupar o Supabase

echo "═══════════════════════════════════════════════════════════════════"
echo "🎬 WANDA - Supabase Integration Setup"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "📋 PASSO 1: Criar Tabelas no Supabase"
echo ""
echo "1. Abra: https://app.supabase.com/project/cgpkfhrqprqptvehatad/sql"
echo "2. Copie TODO o conteúdo de: SUPABASE_SETUP.sql"
echo "3. Cole no SQL Editor do Supabase"
echo "4. Clique em 'RUN'"
echo ""
echo "✅ As tabelas serão criadas!"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "📋 PASSO 2: Verificar .env.local"
echo ""
echo "Certifique-se de ter em .env.local:"
echo "   VITE_SUPABASE_URL=https://cgpkfhrqprqptvehatad.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY=seu_api_key"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "📋 PASSO 3: Ingererir Posts WANDA"
echo ""
echo "Execute:"
echo "   node scripts/wanda-supabase-ingest.mjs"
echo ""
echo "Isso vai:"
echo "   ✅ Ler os 36 posts WANDA"
echo "   ✅ Ingererir no Supabase com métricas"
echo "   ✅ Criar índices para performance"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "📊 PASSO 4: Acessar Dashboard"
echo ""
echo "Na Supabase:"
echo "   Vá em Table Editor → wanda_posts"
echo "   Veja todos os 36 posts com métricas!"
echo ""

echo "📈 PASSO 5: Queries SQL Úteis"
echo ""
echo "Copie e execute no SQL Editor:"
echo ""
echo "-- Top 10 posts"
echo "SELECT * FROM wanda_posts ORDER BY views DESC LIMIT 10;"
echo ""
echo "-- Posts trending"
echo "SELECT * FROM v_wanda_top_posts;"
echo ""
echo "-- Performance por tipo"
echo "SELECT * FROM v_wanda_performance_by_type;"
echo ""
echo "-- Performance por criador"
echo "SELECT * FROM v_wanda_performance_by_creator;"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "✅ Setup Completo! Vamos começar?"
echo "═══════════════════════════════════════════════════════════════════"
