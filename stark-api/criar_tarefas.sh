#!/bin/bash
API="http://localhost:3001/api/tarefas"

echo "Criando tarefa 1..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Interpolar variaveis em Canned Responses","descricao":"Criar funcao interpolateCannedResponse e usar no sendMessage","status":"pendente","prioridade":"alta","responsavel":"Israel Lemos","deadline":"2026-06-21T18:00:00"}'

echo ""
echo "Criando tarefa 2..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Implementar Snooze","descricao":"Criar UI modal hook snoozeConversation e Edge Function cron","status":"pendente","prioridade":"media","responsavel":"Israel Lemos","deadline":"2026-06-25T18:00:00"}'

echo ""
echo "Criando tarefa 3..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Criar Macros","descricao":"Criar sistema de macros tabela executor e UI","status":"pendente","prioridade":"media","responsavel":"Israel Lemos","deadline":"2026-06-28T18:00:00"}'

echo ""
echo "Criando tarefa 4..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Implementar CSAT","descricao":"Enviar pesquisa 1-5 estrelas apos resolucao","status":"pendente","prioridade":"baixa","responsavel":"Israel Lemos","deadline":"2026-07-02T18:00:00"}'

echo ""
echo "Criando tarefa 5..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Criar Mentions","descricao":"Detectar username e criar notificacao","status":"pendente","prioridade":"baixa","responsavel":"Israel Lemos","deadline":"2026-07-05T18:00:00"}'

echo ""
echo "Criando tarefa 6..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Dashboard de SLA","descricao":"Metricas de tempo medio de resposta e resolucao","status":"pendente","prioridade":"baixa","responsavel":"Israel Lemos","deadline":"2026-07-10T18:00:00"}'

echo ""
echo "Criando tarefa 7..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Configurar IA Local","descricao":"Instalar Ollama baixar Gemma 4 testar em portugues","status":"pendente","prioridade":"alta","responsavel":"Israel Lemos","deadline":"2026-06-21T18:00:00"}'

echo ""
echo "Criando tarefa 8..."
curl -s -X POST $API \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Template n8n Automacao","descricao":"Criar 3 templates de automacao de vendas no n8n","status":"pendente","prioridade":"media","responsavel":"Israel Lemos","deadline":"2026-06-21T18:00:00"}'

echo ""
echo "Tarefas criadas!"
