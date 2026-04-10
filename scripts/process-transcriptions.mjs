/**
 * Script de processamento de transcrições
 * Processa CSV de transcrições e gera JSONs para WANDA e SCRIVO
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simular processamento com dados REAIS (sem Ollama por enquanto)
function processWithMockData(record) {
  const text = record.Transcrição;
  const subject = record.Subject;

  // Extrair insights reais do conteúdo
  const sentences = text.split('.').filter(s => s.length > 20);
  const insights = sentences.slice(0, 3).map(s => s.trim().substring(0, 100));

  // Classificar baseado em palavras-chave
  const keywords = {
    educational: ['tutorial', 'aprenda', 'técnica', 'como', 'passo'],
    entertainment: ['humor', 'diversão', 'engracado', 'rápido'],
    sales: ['venda', 'investir', 'ganhar', 'lucro', 'grana'],
    tutorial: ['como', 'passo', 'tutorial', 'setup'],
  };

  let category = 'other';
  for (const [cat, kwds] of Object.entries(keywords)) {
    if (kwds.some(kw => text.toLowerCase().includes(kw))) {
      category = cat;
      break;
    }
  }

  // Gerar tags baseadas no subject e conteúdo
  const tags = [
    `#${subject.split(' ')[0].toLowerCase()}`,
    text.toLowerCase().includes('ia') || text.toLowerCase().includes('ai') ? '#ia' : '#tech',
    text.toLowerCase().includes('automação') ? '#automacao' : '#tech',
    '#tiktok',
    '#marketing',
  ].slice(0, 5);

  // Extrair CTAs
  const ctaPatterns = ['me segue', 'compartilha', 'like', 'ativa notificação', 'subscribe', 'comenta', 'clica no link'];
  const ctas = ctaPatterns.filter(cta => text.toLowerCase().includes(cta));

  // Detectar trending topics
  const trendingKeywords = ['ia', 'claude', 'chatgpt', 'automação', 'agentes', 'rag', 'copilot', 'gemini'];
  const trendingTopics = trendingKeywords.filter(topic => text.toLowerCase().includes(topic)).slice(0, 4);

  // Resumo
  const summary = sentences[0]?.trim().substring(0, 150) || subject;

  // Script otimizado
  const script = `E aí! Saiba: ${subject.substring(0, 40)}... Assista como funciona e depois me segue pra mais. `;

  return {
    status: 'success',
    originalRecord: record,
    subject,
    insights: insights.length > 0 ? insights : [`Tema: ${subject}`, 'IA e automação', 'Transformação digital'],
    summary,
    tags,
    ctas: ctas.length > 0 ? ctas : ['me segue', 'compartilha'],
    trendingTopics: trendingTopics.length > 0 ? trendingTopics : ['IA'],
    category,
    script,
  };
}

// Parsear CSV simples
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    // Parse CSV simples (sem suporte para quoted fields com vírgulas, por simplicidade)
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length >= 3) {
      rows.push({
        Subject: values[0] || '',
        Transcrição: values[1] || '',
        Criador: values[2] || '',
      });
    }
  }

  return rows;
}

// Gerar dados para WANDA
function generateWandaData(processed) {
  return processed
    .filter(r => r.status === 'success')
    .map(r => ({
      id: r.subject?.substring(0, 30) || 'unknown',
      subject: r.subject,
      creator: r.originalRecord.Criador,
      summary: r.summary,
      insights: r.insights?.slice(0, 3) || [],
      tags: r.tags?.slice(0, 5) || [],
      ctas: r.ctas || [],
      trendingTopics: r.trendingTopics || [],
      category: r.category,
      promptForWanda: `Criar 3 variações de posts para Instagram/TikTok:
    
TEMA: ${r.subject}
RESUMO: ${r.summary}
INSIGHTS: ${r.insights?.join(', ')}
TAGS: ${r.tags?.join(', ')}
CTAs: ${r.ctas?.join(', ')}
CATEGORIA: ${r.category}

REQUISITOS: Hook viral (1s), versão educativa, versão com CTA forte.`,
    }));
}

// Gerar dados para SCRIVO
function generateScrivoData(processed) {
  return processed
    .filter(r => r.status === 'success')
    .map(r => ({
      id: r.subject?.substring(0, 30) || 'unknown',
      subject: r.subject,
      creator: r.originalRecord.Criador,
      originalScript: r.originalRecord.Transcrição.substring(0, 300),
      optimizedScript: r.script || '',
      ctas: r.ctas || [],
      toneOfVoice: r.category === 'entertainment' ? 'casual' : 'informativo',
      targetAudience: 'tech entrepreneurs, business owners',
      promptForScrivo: `Otimize este script TikTok:

ORIGINAL: ${r.originalRecord.Transcrição.substring(0, 150)}...
OTIMIZADO: ${r.script}
CTAs: ${r.ctas?.join(', ')}

Melhore: adicione storytelling, suspense, closing forte.`,
    }));
}

// Main
async function main() {
  try {
    console.log('📊 Iniciando processamento de transcrições...\n');

    // Ler CSV
    const csvPath = path.join(__dirname, '../data/transcricoes_tiktok.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    console.log(`✅ CSV lido: ${rows.length} registros\n`);

    // Processar cada registro
    const processed = [];
    for (let i = 0; i < rows.length; i++) {
      console.log(`⏳ Processando [${i + 1}/${rows.length}] ${rows[i].Subject.substring(0, 40)}...`);
      const result = processWithMockData(rows[i]);
      processed.push(result);
    }

    console.log(`\n✅ Todos os registros processados!\n`);

    // Gerar outputs
    const wandaData = generateWandaData(processed);
    const scrivoData = generateScrivoData(processed);

    // Salvar arquivos
    const outputDir = path.join(__dirname, '../data/outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'transcription-processed.json'),
      JSON.stringify(processed, null, 2)
    );
    console.log('✅ Salvo: transcription-processed.json');

    fs.writeFileSync(
      path.join(outputDir, 'data-for-wanda.json'),
      JSON.stringify(wandaData, null, 2)
    );
    console.log('✅ Salvo: data-for-wanda.json');

    fs.writeFileSync(
      path.join(outputDir, 'data-for-scrivo.json'),
      JSON.stringify(scrivoData, null, 2)
    );
    console.log('✅ Salvo: data-for-scrivo.json');

    // Resumo
    const successCount = processed.filter(p => p.status === 'success').length;
    console.log(`\n📈 RESUMO:\n- Total: ${processed.length}\n- Sucessos: ${successCount}\n- Taxa: ${Math.round((successCount / processed.length) * 100)}%`);
    console.log(`\n📁 Outputs em: ${outputDir}`);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
