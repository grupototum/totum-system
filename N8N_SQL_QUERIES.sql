/**
 * N8N - SQL Queries para WANDA Automation
 * 
 * Use essas queries nos nodes PostgreSQL do N8N
 */

-- ═══════════════════════════════════════════════════════════════════
-- 1. GET: Posts não publicados (para publicar)
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  post_id,
  subject,
  creator,
  tipo,
  hook,
  hashtags_string,
  views,
  engagement_rate,
  created_at
FROM wanda_posts 
WHERE published_at IS NULL 
ORDER BY created_at ASC 
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════
-- 2. UPDATE: Marcar post como publicado
-- ═══════════════════════════════════════════════════════════════════
UPDATE wanda_posts 
SET 
  tiktok_video_id = '{{ $node["TikTok Publish"].json.data.video_id }}',
  published_at = NOW(),
  last_updated_at = NOW()
WHERE post_id = '{{ $node["Get Unpublished Post"].json.post_id }}';

-- ═══════════════════════════════════════════════════════════════════
-- 3. INSERT: Registrar métrica no histórico
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO wanda_analytics (
  post_id,
  views,
  likes,
  comments,
  shares,
  saves,
  engagement_rate,
  conversion_rate,
  recorded_at
) VALUES (
  '{{ $node["Get Video Stats"].json.post_id }}',
  {{ $node["Get Video Stats"].json.stats.views }},
  {{ $node["Get Video Stats"].json.stats.likes }},
  {{ $node["Get Video Stats"].json.stats.comments }},
  {{ $node["Get Video Stats"].json.stats.shares }},
  {{ $node["Get Video Stats"].json.stats.saves }},
  {{ $node["Get Video Stats"].json.stats.engagement_rate }},
  {{ $node["Get Video Stats"].json.stats.conversion_rate }},
  NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- 4. GET: Posts publicados com métricas
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  p.post_id,
  p.subject,
  p.views,
  p.engagement_rate,
  p.published_at,
  COUNT(a.id) as metric_updates,
  MAX(a.recorded_at) as last_metric_update
FROM wanda_posts p
LEFT JOIN wanda_analytics a ON p.post_id = a.post_id
WHERE p.published_at IS NOT NULL
GROUP BY p.post_id
ORDER BY p.published_at DESC;

-- ═══════════════════════════════════════════════════════════════════
-- 5. GET: Top posts em tempo real (trending)
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  post_id,
  subject,
  creator,
  views,
  likes,
  comments,
  shares,
  engagement_rate,
  CASE 
    WHEN engagement_rate > 14 THEN '🔥 Viral'
    WHEN engagement_rate > 10 THEN '⭐ Bomba'
    WHEN engagement_rate > 8 THEN '✅ Bom'
    ELSE '📈 Normal'
  END as status,
  published_at
FROM wanda_posts
ORDER BY views DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════
-- 6. GET: Performance por tipo
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  tipo,
  COUNT(*) as total_posts,
  COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published,
  AVG(views) as avg_views,
  MAX(views) as max_views,
  AVG(engagement_rate) as avg_engagement,
  SUM(views) as total_views
FROM wanda_posts
GROUP BY tipo
ORDER BY avg_engagement DESC;

-- ═══════════════════════════════════════════════════════════════════
-- 7. GET: Posts que precisam de atenção (métricas baixas)
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  post_id,
  subject,
  views,
  engagement_rate,
  published_at,
  NOW() - published_at as age
FROM wanda_posts
WHERE published_at IS NOT NULL
  AND views < (SELECT AVG(views) FROM wanda_posts WHERE published_at IS NOT NULL) / 2
ORDER BY published_at DESC;

-- ═══════════════════════════════════════════════════════════════════
-- 8. INSERT: Trending score update
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO wanda_trending (post_id, trend_score, rank)
SELECT 
  post_id,
  (views * (1 + engagement_rate / 100)) as trend_score,
  ROW_NUMBER() OVER (ORDER BY views DESC) as rank
FROM wanda_posts
WHERE published_at IS NOT NULL
ON CONFLICT (post_id) DO UPDATE SET
  trend_score = EXCLUDED.trend_score,
  rank = EXCLUDED.rank,
  updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════
-- 9. GET: Próximo post a publicar (com detalhes)
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  post_id,
  subject,
  creator,
  tipo,
  hook,
  cta,
  hashtags_string,
  views as estimated_views,
  engagement_rate as estimated_engagement,
  engagement_rate * views / 100 as estimated_interactions
FROM wanda_posts 
WHERE published_at IS NULL 
ORDER BY created_at ASC 
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════
-- 10. GET: Dashboard summary (para email/notificação)
-- ═══════════════════════════════════════════════════════════════════
SELECT 
  COUNT(*) as total_posts,
  COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published_posts,
  COUNT(CASE WHEN published_at IS NULL THEN 1 END) as pending_posts,
  SUM(views) as total_views,
  AVG(engagement_rate) as avg_engagement,
  MAX(views) as top_views,
  MAX(engagement_rate) as top_engagement
FROM wanda_posts;
