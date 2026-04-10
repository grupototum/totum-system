/**
 * SUPABASE - Setup Inicial
 * 
 * Crie as tabelas no Supabase com este script SQL
 * Copie e cole no SQL Editor: https://app.supabase.com/project/cgpkfhrqprqptvehatad/sql
 */

-- ═══════════════════════════════════════════════════════════════
-- TABELA: wanda_posts
-- Armazena todos os 36 posts gerados pelo WANDA
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wanda_posts (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  creator TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('viral', 'educational', 'conversion')),
  hook TEXT NOT NULL,
  body TEXT,
  cta TEXT,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  hashtags_string TEXT,
  emojis TEXT,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  estimated_conversions INTEGER DEFAULT 0,
  
  -- URLs
  tiktok_url TEXT,
  tiktok_video_id TEXT,
  
  -- Metadata
  published_at TIMESTAMP WITH TIME ZONE,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wanda_posts_creator ON wanda_posts(creator);
CREATE INDEX idx_wanda_posts_tipo ON wanda_posts(tipo);
CREATE INDEX idx_wanda_posts_views ON wanda_posts(views DESC);
CREATE INDEX idx_wanda_posts_engagement ON wanda_posts(engagement_rate DESC);
CREATE INDEX idx_wanda_posts_published ON wanda_posts(published_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- TABELA: wanda_analytics
-- Histórico de métricas (tracking ao longo do tempo)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wanda_analytics (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES wanda_posts(post_id) ON DELETE CASCADE,
  
  -- Métricas
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  engagement_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  
  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_post_timestamp UNIQUE (post_id, recorded_at)
);

CREATE INDEX idx_wanda_analytics_post_id ON wanda_analytics(post_id);
CREATE INDEX idx_wanda_analytics_recorded_at ON wanda_analytics(recorded_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- TABELA: wanda_trending
-- Posts em trending em tempo real (cache)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wanda_trending (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES wanda_posts(post_id) ON DELETE CASCADE,
  trend_score DECIMAL(10,2) NOT NULL,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_trending_post UNIQUE (post_id)
);

CREATE INDEX idx_wanda_trending_score ON wanda_trending(trend_score DESC);
CREATE INDEX idx_wanda_trending_rank ON wanda_trending(rank);

-- ═══════════════════════════════════════════════════════════════
-- TABELA: wanda_performance
-- Resumo agregado de performance por tipo/criador
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wanda_performance (
  id BIGSERIAL PRIMARY KEY,
  
  -- Dimensões
  tipo TEXT,
  creator TEXT,
  time_period TEXT DEFAULT 'all_time',
  
  -- Agregados
  total_posts INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  
  -- Médias
  avg_views DECIMAL(10,2) DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  avg_conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Bests
  best_post_id TEXT,
  best_views INTEGER,
  
  -- Timestamp
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_performance UNIQUE (tipo, creator, time_period)
);

CREATE INDEX idx_wanda_performance_tipo ON wanda_performance(tipo);
CREATE INDEX idx_wanda_performance_creator ON wanda_performance(creator);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS ÚTEIS PARA ANALYTICS
-- ═══════════════════════════════════════════════════════════════

-- View: Top Posts
CREATE OR REPLACE VIEW v_wanda_top_posts AS
SELECT 
  post_id,
  subject,
  creator,
  tipo,
  views,
  likes,
  comments,
  shares,
  engagement_rate,
  CASE 
    WHEN engagement_rate > 14 THEN '🔥 Viral'
    WHEN engagement_rate > 10 THEN '⭐ Excelente'
    WHEN engagement_rate > 8 THEN '✅ Bom'
    ELSE '📈 Normal'
  END as performance_level
FROM wanda_posts
ORDER BY views DESC
LIMIT 10;

-- View: Performance por Tipo
CREATE OR REPLACE VIEW v_wanda_performance_by_type AS
SELECT 
  tipo,
  COUNT(*) as total_posts,
  AVG(views) as avg_views,
  MAX(views) as max_views,
  AVG(engagement_rate) as avg_engagement,
  SUM(views) as total_views,
  SUM(estimated_conversions) as total_conversions
FROM wanda_posts
GROUP BY tipo
ORDER BY avg_engagement DESC;

-- View: Performance por Criador
CREATE OR REPLACE VIEW v_wanda_performance_by_creator AS
SELECT 
  creator,
  COUNT(*) as total_posts,
  AVG(views) as avg_views,
  MAX(views) as max_views,
  AVG(engagement_rate) as avg_engagement,
  SUM(views) as total_views,
  SUM(estimated_conversions) as total_conversions
FROM wanda_posts
GROUP BY creator
ORDER BY total_views DESC;

-- ═══════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════
-- Copie este SQL inteiro e execute no Supabase SQL Editor
-- URL: https://app.supabase.com/project/cgpkfhrqprqptvehatad/sql
