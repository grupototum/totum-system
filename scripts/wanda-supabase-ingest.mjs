/**
 * WANDA - Supabase Ingestion Script
 * 
 * Ingere os 36 posts WANDA para Supabase com métricas de engajamento
 * Execute: node scripts/wanda-supabase-ingest.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── SUPABASE CONFIG ───
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrado em .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

class WandaSupabaseIngestion {
  async ingestPosts() {
    console.log('📊 WANDA - Supabase Ingestion\n');
    console.log('═'.repeat(70));

    // Load WANDA data with metrics
    const wandaPath = path.join(__dirname, '../data/outputs/wanda-tiktok-results.json');
    if (!fs.existsSync(wandaPath)) {
      console.log('\n❌ Arquivo wanda-tiktok-results.json não encontrado!');
      console.log('   Execute: node scripts/wanda-tiktok-publisher.mjs\n');
      process.exit(1);
    }

    const wandaData = JSON.parse(fs.readFileSync(wandaPath, 'utf-8'));
    const posts = wandaData.posts;

    console.log(`\n📥 Ingerindo ${posts.length} posts para Supabase...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      
      try {
        const postData = {
          post_id: post.id,
          subject: post.subject,
          creator: post.creator,
          tipo: post.tipo,
          hook: post.hook,
          body: '',
          cta: '',
          hashtags: post.hashtags || [],
          hashtags_string: post.hashtags?.join(' ') || '',
          
          // Métricas
          views: post.metrics.views,
          likes: post.metrics.likes,
          comments: post.metrics.comments,
          shares: post.metrics.shares,
          saves: post.metrics.saves,
          engagement_rate: parseFloat(post.metrics.engagementRate),
          conversion_rate: parseFloat(post.metrics.conversionRate),
          estimated_conversions: Math.ceil(post.metrics.views * (parseFloat(post.metrics.conversionRate) / 100)),
          
          // URLs
          tiktok_url: post.tiktokUrl,
          tiktok_video_id: post.id,
          
          // Timestamps
          published_at: new Date(post.publishedAt).toISOString(),
          last_updated_at: new Date().toISOString(),
        };

        // Insert into Supabase
        const { data, error } = await supabase
          .from('wanda_posts')
          .upsert(postData, { onConflict: 'post_id' });

        if (error) {
          console.error(`   ❌ [${i + 1}/${posts.length}] ${post.subject.substring(0, 40)}`);
          console.error(`      Erro: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ [${i + 1}/${posts.length}] ${post.subject.substring(0, 40)}`);
          console.log(`      Views: ${post.metrics.views} | Eng: ${post.metrics.engagementRate}%`);
          successCount++;
        }

        // Rate limit: 100ms entre inserts
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`   ❌ Erro ao processar post ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`\n📊 RESULTADO:\n`);
    console.log(`   ✅ Posts Ingeridos: ${successCount}`);
    console.log(`   ❌ Posts com Erro: ${errorCount}`);
    console.log(`   📈 Taxa de Sucesso: ${((successCount / posts.length) * 100).toFixed(1)}%\n`);

    if (successCount > 0) {
      console.log('🎉 Dados salvos no Supabase!\n');
      console.log('📊 URLs úteis:\n');
      console.log(`   Dashboard: https://app.supabase.com/project/cgpkfhrqprqptvehatad/editor/29537`);
      console.log(`   SQL Editor: https://app.supabase.com/project/cgpkfhrqprqptvehatad/sql\n`);
      
      console.log('📈 Queries úteis para SQL:\n');
      console.log(`   -- Top 10 posts por views`);
      console.log(`   SELECT * FROM wanda_posts ORDER BY views DESC LIMIT 10;\n`);
      
      console.log(`   -- Performance por tipo`);
      console.log(`   SELECT tipo, COUNT(*) as total, AVG(views) as avg_views, AVG(engagement_rate) as avg_eng`);
      console.log(`   FROM wanda_posts GROUP BY tipo;\n`);
      
      console.log(`   -- Posts trending agora`);
      console.log(`   SELECT * FROM v_wanda_top_posts;\n`);
    }

    return { successCount, errorCount };
  }
}

// Main
async function main() {
  const ingestion = new WandaSupabaseIngestion();
  await ingestion.ingestPosts();
}

main().catch(console.error);
