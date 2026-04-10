/**
 * Ingestion para Supabase RAG
 * Insere 12 documentos em rag_documents table com embeddings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CONFIG ───
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMyNzUyMDAsImV4cCI6MzA5OTkyNzIwMH0.HXVMlz_TBTwYXxO4LUV0DKpHzpQNvA1BqLtYrFdKEEA';

// Simple embedding function (not real ML, just for demo)
function simpleEmbedding(text) {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);

  for (let i = 0; i < Math.min(words.length, 384); i++) {
    const hash = words[i].charCodeAt(0) * 12345;
    embedding[i] = (hash % 1000) / 1000;
  }

  return embedding;
}

// Supabase REST API Client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    };
  }

  async insert(table, data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return { success: true };
    } catch (err) {
      console.error(`  ❌ Erro ao inserir: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async query(table, select = '*', filters = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}?select=${select}`;

      for (const [key, value] of Object.entries(filters)) {
        url += `&${key}=${encodeURIComponent(value)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`  ❌ Erro ao consultar: ${err.message}`);
      return [];
    }
  }
}

// Main ingestion
async function ingestToSupabase() {
  console.log('🚀 Iniciando ingestion para Supabase...\n');

  const client = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test connection
  console.log('🔌 Testando conexão com Supabase...');
  const testResult = await client.query('rag_documents', 'count', {});
  if (testResult.length === 0 && !Array.isArray(testResult)) {
    console.log('⚠️  Supabase respondeu. Prosseguindo...\n');
  } else {
    console.log(`✅ Supabase conectado. Documentos atuais: ${testResult.length || 0}\n`);
  }

  // Ler processed data
  const dataPath = path.join(__dirname, '../data/outputs/transcription-processed-ollama.json');
  const processed = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📥 Ingerindo ${processed.length} documentos...\n`);

  let successCount = 0;
  for (let i = 0; i < processed.length; i++) {
    const record = processed[i];

    console.log(`[${i + 1}/${processed.length}] ${record.subject.substring(0, 40)}...`);

    // Preparar documento
    const document = {
      title: record.subject,
      content: record.originalRecord.Transcrição.substring(0, 2000),
      creator: record.originalRecord.Criador,
      category: record.category,
      insights: JSON.stringify(record.insights || []),
      tags: JSON.stringify(record.tags || []),
      ctas: JSON.stringify(record.ctas || []),
      trending_topics: JSON.stringify(record.trendingTopics || []),
      summary: record.summary,
      script_optimized: record.script,
      embedding: JSON.stringify(simpleEmbedding(record.subject + ' ' + record.summary)),
      metadata: JSON.stringify({
        processedWith: record.processedWith || 'heuristics',
        processedAt: new Date().toISOString(),
      }),
    };

    // Inserir
    const result = await client.insert('rag_documents', document);
    if (result.success) {
      console.log(`  ✅ Inserido\n`);
      successCount++;
    } else {
      console.log('');
    }
  }

  console.log(`\n✅ Ingestion completa!`);
  console.log(`- Total: ${processed.length}`);
  console.log(`- Sucesso: ${successCount}`);
  console.log(`- Taxa: ${Math.round((successCount / processed.length) * 100)}%`);

  // Verify count
  console.log('\n📊 Verificando Supabase...');
  const finalCount = await client.query('rag_documents', 'count', {});
  console.log(`- Documentos em Supabase: ${finalCount.length || '?'}`);
}

ingestToSupabase().catch(console.error);
