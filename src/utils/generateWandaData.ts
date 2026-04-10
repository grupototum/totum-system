/**
 * Gerador de dados para WANDA (agente de conteúdo social)
 * Transforma dados de transcrição em prompts otimizados para geração de posts
 */

export interface TranscriptionResult {
  id: string;
  subject: string;
  criador: string;
  transcricao: string;
  insights?: string[];
  summary?: string;
  tags?: string[];
  ctas?: string[];
  trendingTopics?: string[];
  category?: string;
  script?: string;
}

export interface WandaPrompt {
  id: string;
  subject: string;
  creator: string;
  summary: string;
  insights: string[];
  tags: string[];
  ctas: string[];
  trendingTopics: string[];
  category: string;
  promptForWanda: string;
  timestamp: string;
}

/**
 * Converte resultado de transcrição em prompt para WANDA
 */
export function convertToWandaPrompt(result: TranscriptionResult): WandaPrompt {
  const insights = result.insights?.slice(0, 3) || ['IA', 'automação', 'conteúdo'];
  const tags = result.tags?.slice(0, 5) || ['#tiktok', '#ia', '#content'];
  const ctas = result.ctas || ['me segue', 'compartilha'];
  const category = result.category || 'entertainment';

  const prompt = `Criar 3 variações de posts para Instagram/TikTok:
    
TEMA: ${result.subject}
CRIADOR: ${result.criador}
RESUMO: ${result.summary || result.transcricao.substring(0, 100)}
INSIGHTS: ${insights.join(', ')}
TAGS RECOMENDADAS: ${tags.join(', ')}
CTAs SUGERIDAS: ${ctas.join(', ')}
CATEGORIA: ${category}

REQUISITOS PARA OS 3 POSTS:
1. Post 1: Hook viral - foco em chamar atenção em 1s
2. Post 2: Educational - ensinar algo do tema
3. Post 3: CTA forte - conversão e engajamento

Cada post deve ter:
- Texto principal (máx 150 caracteres)
- Emojis estratégicos
- 1-2 hashtags por post
- Tom adaptado ao criador

Responda em JSON com este formato:
{
  "posts": [
    {
      "numero": 1,
      "tipo": "viral",
      "texto": "...",
      "hashtags": ["#...", "#..."],
      "emojis": "...",
      "notasProducao": "..."
    },
    ...
  ]
}`;

  return {
    id: result.id,
    subject: result.subject,
    creator: result.criador,
    summary: result.summary || result.transcricao.substring(0, 150),
    insights,
    tags,
    ctas,
    trendingTopics: result.trendingTopics || ['IA'],
    category,
    promptForWanda: prompt,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gera lote de prompts para WANDA
 */
export function generateWandaBatch(results: TranscriptionResult[]): WandaPrompt[] {
  return results
    .filter((r) => r.transcricao && r.subject)
    .map((r) => convertToWandaPrompt(r));
}
