/**
 * Simulador WANDA - Agente de Conteúdo Social
 * Gera 3 variações de posts para cada vídeo TikTok
 * Output: 36 posts totais (3 × 12 registros)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates de posts
const postTemplates = {
  viral: {
    hook: (subject) => `🎯 ${subject.substring(0, 30)}...`,
    body: (summary) => `Você NÃO sabia que ${summary.substring(0, 50)}?`,
    cta: (ctas) => ctas[0] || 'Me segue',
  },
  educational: {
    hook: (subject) => `💡 Aprenda: ${subject.substring(0, 25)}`,
    body: (summary) => `Passo 1️⃣ ${summary.substring(0, 40)}...`,
    cta: (ctas) => ctas[1] || 'Compartilha',
  },
  conversion: {
    hook: (subject) => `🚀 QUER ${subject.substring(0, 20).toUpperCase()}?`,
    body: (summary) => `${summary.substring(0, 50)} ⬇️ Leia nos comentários!`,
    cta: (ctas) => ctas[0] || 'Clica aqui',
  },
};

function generateWandaPost(record, templateType) {
  const { subject, summary, tags, ctas } = record;
  const template = postTemplates[templateType];

  return {
    tipo: templateType,
    hook: template.hook(subject),
    body: template.body(summary),
    cta: template.cta(ctas),
    hashtags: tags.slice(0, 3).join(' '),
    emojis: templateType === 'viral' ? '🔥⚡✨' : templateType === 'educational' ? '📚💻🎯' : '💰🚀👀',
    totalCharacters: `${template.hook(subject).length + template.body(summary).length}`.padStart(3, ' '),
    estimatedViralScore: 85 + Math.random() * 15,
  };
}

async function main() {
  console.log('🎬 WANDA — Gerador de Posts Sociais\n');
  console.log('═'.repeat(60));

  // Ler data
  const dataPath = path.join(__dirname, '../data/outputs/data-for-wanda-ollama.json');
  const wandaData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`\n👥 Processando ${wandaData.length} temas...`);
  console.log(`📊 Gerando ${wandaData.length * 3} posts...\n`);

  const allPosts = [];

  for (let i = 0; i < wandaData.length; i++) {
    const record = wandaData[i];
    console.log(`[${i + 1}/${wandaData.length}] ${record.subject.substring(0, 35)}...`);

    const posts = {
      id: record.id,
      subject: record.subject,
      creator: record.creator,
      posts: [
        generateWandaPost(record, 'viral'),
        generateWandaPost(record, 'educational'),
        generateWandaPost(record, 'conversion'),
      ],
    };

    allPosts.push(posts);

    // Mostrar preview (primeira variação)
    const firstPost = posts.posts[0];
    console.log(`  ├─ 🔥 VIRAL: "${firstPost.hook}"`);
    console.log(`  ┌─ ${firstPost.hashtags}`);
    console.log('');
  }

  // Salvar outputs
  const outputDir = path.join(__dirname, '../data/outputs');
  fs.mkdirSync(outputDir, { recursive: true });

  // Formato aggregado
  fs.writeFileSync(
    path.join(outputDir, 'wanda-output.json'),
    JSON.stringify({
      agentName: 'WANDA',
      agentType: 'social-content-generator',
      timestamp: new Date().toISOString(),
      processedRecords: allPosts.length,
      totalPostsGenerated: allPosts.length * 3,
      posts: allPosts,
    }, null, 2)
  );

  console.log('═'.repeat(60));
  console.log(`\n✅ WANDA Completo!`);
  console.log(`📊 Estatísticas:\n`);
  console.log(`  - Temas processados: ${allPosts.length}`);
  console.log(`  - Posts gerados: ${allPosts.length * 3}`);
  console.log(`  - Variações por tema: 3 (viral, educacional, conversão)`);
  console.log(`  - Taxa de sucesso: 100%\n`);
  console.log(`📁 Output: data/outputs/wanda-output.json`);
}

main().catch(console.error);
